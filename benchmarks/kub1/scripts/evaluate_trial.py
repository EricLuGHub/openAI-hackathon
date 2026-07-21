#!/usr/bin/env python3
"""Evaluate a stopped solver patch in a fresh, evaluator-only checkout."""

import argparse
import datetime as dt
import hashlib
import json
import shlex
from pathlib import Path
import subprocess
import tarfile
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def execute(command, cwd, timeout):
    started = time.monotonic()
    try:
        result = subprocess.run(command, cwd=cwd, shell=True, text=True,
                                capture_output=True, timeout=timeout)
        return {"command": command, "exit_code": result.returncode,
                "timed_out": False, "wall_time_seconds": round(time.monotonic() - started, 3),
                "stdout": result.stdout, "stderr": result.stderr}
    except subprocess.TimeoutExpired as error:
        return {"command": command, "exit_code": None, "timed_out": True,
                "wall_time_seconds": round(time.monotonic() - started, 3),
                "stdout": error.stdout or "", "stderr": error.stderr or ""}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("trial", type=Path)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--snapshot-sha256", required=True)
    args = parser.parse_args()
    trial, snapshot = args.trial.resolve(), args.snapshot.resolve()
    metadata = json.loads((trial / "metadata.json").read_text())
    if metadata["status"] == "running":
        parser.error("refusing to evaluate a running solver")
    data = snapshot.read_bytes()
    actual_hash = hashlib.sha256(data).hexdigest()
    if actual_hash != args.snapshot_sha256.lower() or actual_hash != metadata["snapshot_sha256"]:
        parser.error("snapshot hash does not match evaluator argument and trial metadata")
    config = json.loads((ROOT / "evaluator-config.json").read_text())
    results = {"status": "running", "started_at": dt.datetime.now(dt.timezone.utc).isoformat(),
               "validation_level": "hidden_and_package_tests", "steps": []}
    with tempfile.TemporaryDirectory(prefix="kub1-eval-") as temporary:
        checkout = Path(temporary) / "repo"
        checkout.mkdir()
        with tarfile.open(snapshot) as archive:
            try:
                archive.extractall(checkout, filter="data")
            except TypeError:
                # Python <3.12 compatibility for the local hash-pinned archive.
                archive.extractall(checkout)
        children = list(checkout.iterdir())
        repo = children[0] if len(children) == 1 and children[0].is_dir() else checkout
        # Normalize filesystem extraction (notably CRLF behavior on macOS) to
        # the immutable Git snapshot before applying evaluator artifacts.
        subprocess.run(["git", "reset", "--hard", "HEAD"], cwd=repo,
                       check=True, capture_output=True, text=True)
        patch = trial / "final.patch"
        hidden_patch = ROOT / config["hidden_tests_patch"]
        hidden_patch_copy = Path(temporary) / "hidden-tests.patch"
        hidden_patch_copy.write_bytes(hidden_patch.read_bytes())
        shared_test_file = (
            "staging/src/k8s.io/dynamic-resource-allocation/structured/"
            "internal/allocatortesting/allocator_testing.go"
        )
        for name, command in (
            ("apply_hidden_tests", f"git apply --index {shlex.quote(str(hidden_patch_copy))}"),
            (
                "apply_candidate_production",
                "git apply --index "
                f"--exclude={shlex.quote(shared_test_file)} "
                f"{shlex.quote(str(patch))}",
            ),
            ("focused_tests", config["focused_command"]),
            ("broader_tests", config["broader_command"]),
        ):
            if name in {"focused_tests", "broader_tests"} and config.get("docker_image"):
                command = (
                    "docker run --rm "
                    f"-v {shlex.quote(str(repo))}:/src "
                    "-v kub1-gomod:/go/pkg/mod "
                    "-v kub1-gobuild:/root/.cache/go-build "
                    f"-w /src {shlex.quote(config['docker_image'])} {command}"
                )
            outcome = execute(command, repo, config["command_timeout_seconds"])
            outcome["name"] = name
            results["steps"].append(outcome)
            if outcome["exit_code"] != 0 and name.startswith("apply_"):
                break
    results["ended_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    results["status"] = "passed" if len(results["steps"]) == 4 and all(
        step["exit_code"] == 0 for step in results["steps"]) else "failed"
    (trial / "evaluator-results.json").write_text(json.dumps(results, indent=2, sort_keys=True) + "\n")
    return 0 if results["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
