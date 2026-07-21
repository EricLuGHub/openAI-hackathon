#!/usr/bin/env python3
"""Run one isolated KUB1 solver trial and preserve raw artifacts."""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command, cwd, **kwargs):
    return subprocess.run(command, cwd=cwd, text=True, **kwargs)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "condition", choices=("control", "assisted", "target-informed")
    )
    parser.add_argument("run_id", help="Unique run label, for example 01")
    parser.add_argument("--snapshot", type=Path, required=True,
                        help="Immutable sanitized .tar/.tar.gz snapshot")
    parser.add_argument("--snapshot-sha256", required=True)
    parser.add_argument("--haderach-url", default="http://127.0.0.1:3001/mcp")
    args = parser.parse_args()

    limits = json.loads((ROOT / "limits.json").read_text())
    snapshot = args.snapshot.resolve()
    if not snapshot.is_file():
        parser.error(f"snapshot does not exist: {snapshot}")
    actual_hash = sha256(snapshot)
    if actual_hash != args.snapshot_sha256.lower():
        parser.error(f"snapshot hash mismatch: expected {args.snapshot_sha256}, got {actual_hash}")

    trial = ROOT / "trials" / f"{args.condition}-{args.run_id}"
    if trial.exists():
        parser.error(f"refusing to overwrite trial: {trial}")
    trial.mkdir(parents=True)
    worktree = trial / "worktree"
    worktree.mkdir()
    with tarfile.open(snapshot) as archive:
        try:
            archive.extractall(worktree, filter="data")
        except TypeError:
            # Python <3.12 has no extraction filter. This archive is locally
            # generated, hash-pinned, and validated before reaching this path.
            archive.extractall(worktree)
    children = list(worktree.iterdir())
    repo = children[0] if len(children) == 1 and children[0].is_dir() else worktree
    if not (repo / ".git").is_dir():
        parser.error("snapshot must contain a sanitized Git repository")

    remotes = run(["git", "remote"], repo, capture_output=True, check=True).stdout.split()
    if remotes:
        parser.error(f"snapshot contains forbidden git remotes: {', '.join(remotes)}")
    initial_status = run(["git", "status", "--porcelain"], repo, capture_output=True, check=True).stdout
    if initial_status:
        parser.error("snapshot repository is not clean")

    base_prompt = (ROOT / "prompts" / "solver.md").read_text()
    prompt = base_prompt
    if args.condition in {"assisted", "target-informed"}:
        prompt += "\n" + (ROOT / "prompts" / "assisted-operations.md").read_text()
    (trial / "submitted-prompt.md").write_text(prompt)

    started = dt.datetime.now(dt.timezone.utc)
    metadata = {
        "experiment_version": limits["experiment_version"],
        "condition": args.condition,
        "run_id": args.run_id,
        "snapshot_path": str(snapshot),
        "snapshot_sha256": actual_hash,
        "base_prompt_sha256": hashlib.sha256(base_prompt.encode()).hexdigest(),
        "submitted_prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(),
        "limits": limits,
        "codex_version": run(["codex", "--version"], repo, capture_output=True, check=True).stdout.strip(),
        "started_at": started.isoformat(),
        "status": "running",
    }
    (trial / "metadata.json").write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n")

    command = [
        "codex", "exec", "-", "--json", "--color", "never", "--ephemeral",
        "--ignore-user-config", "--ignore-rules", "-C", str(repo),
        "--sandbox", limits["sandbox"],
        "-c", f'approval_policy="{limits["approval_policy"]}"',
        "-c", f'model_reasoning_effort="{limits["reasoning_effort"]}"',
        "-o", str(trial / "final-message.md"),
    ]
    if limits.get("model"):
        command += ["-m", limits["model"]]
    if args.condition in {"assisted", "target-informed"}:
        if not os.environ.get("AGENT_HADERACH_TOKEN"):
            parser.error("assisted trials require AGENT_HADERACH_TOKEN in the environment")
        command += [
            "-c", f'mcp_servers.haderach.url="{args.haderach_url}"',
            "-c", 'mcp_servers.haderach.bearer_token_env_var="AGENT_HADERACH_TOKEN"',
        ]

    exit_code, timed_out = None, False
    before = time.monotonic()
    with (trial / "events.jsonl").open("w") as stdout, (trial / "solver.stderr.log").open("w") as stderr:
        process = subprocess.Popen(command, cwd=repo, stdin=subprocess.PIPE, stdout=stdout,
                                   stderr=stderr, text=True, start_new_session=True)
        try:
            process.communicate(prompt, timeout=limits["wall_time_seconds"])
            exit_code = process.returncode
        except subprocess.TimeoutExpired:
            timed_out = True
            process.terminate()
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            exit_code = process.returncode

    # Include untracked solver files in the patch without modifying their contents.
    run(["git", "add", "-N", "."], repo, capture_output=True)
    patch = run(["git", "diff", "--binary", "--no-ext-diff"], repo, capture_output=True, check=True).stdout
    (trial / "final.patch").write_text(patch)
    final_status = run(["git", "status", "--porcelain"], repo, capture_output=True, check=True).stdout
    (trial / "final-status.txt").write_text(final_status)

    summary_command = [sys.executable, str(ROOT / "scripts" / "summarize_events.py"),
                       str(trial / "events.jsonl"), str(trial / "commands.log"),
                       str(trial / "telemetry-summary.json")]
    subprocess.run(summary_command, check=True)
    ended = dt.datetime.now(dt.timezone.utc)
    metadata.update({
        "ended_at": ended.isoformat(),
        "wall_time_seconds": round(time.monotonic() - before, 3),
        "codex_exit_code": exit_code,
        "timed_out": timed_out,
        "status": "timed_out" if timed_out else ("completed" if exit_code == 0 else "failed"),
        "final_patch_sha256": hashlib.sha256(patch.encode()).hexdigest(),
    })
    (trial / "metadata.json").write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n")
    (trial / "evaluator-results.json").write_text(json.dumps({
        "status": "not_evaluated",
        "note": "Solver stopped; run evaluate_trial.py in a fresh evaluator checkout."
    }, indent=2) + "\n")
    print(trial)
    return 0 if exit_code == 0 and not timed_out else 1


if __name__ == "__main__":
    raise SystemExit(main())
