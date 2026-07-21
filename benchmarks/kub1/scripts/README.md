# KUB1 trial scripts

These scripts refuse to run a solver without an existing immutable snapshot and
its expected SHA-256. Each solver receives a fresh extracted Git repository.
The control uses `codex exec --ignore-user-config`, which removes configured MCP
servers; the assisted condition adds only the frozen Haderach endpoint. Both use
the same model, reasoning level, sandbox, deadline, base prompt, and archive.

Run one trial only after the snapshot and manifest go/no-go work is complete:

```sh
python3 benchmarks/kub1/scripts/run_trial.py control 01 \
  --snapshot /absolute/path/kub1-sanitized.tar.gz \
  --snapshot-sha256 EXPECTED_HASH

python3 benchmarks/kub1/scripts/run_trial.py assisted 01 \
  --snapshot /absolute/path/kub1-sanitized.tar.gz \
  --snapshot-sha256 EXPECTED_HASH \
  --haderach-url http://127.0.0.1:3001/mcp
```

After a solver has stopped, evaluate its patch in another fresh extraction:

```sh
python3 benchmarks/kub1/scripts/evaluate_trial.py \
  benchmarks/kub1/trials/control-01 \
  --snapshot /absolute/path/kub1-sanitized.tar.gz \
  --snapshot-sha256 EXPECTED_HASH
```

`events.jsonl` is the immutable raw Codex stream. `commands.log` and
`telemetry-summary.json` are derived conveniences; retain the raw stream when a
new CLI version changes event fields. `worktree/` is intentionally retained for
forensics and should not be used by another trial.

The CLI currently exposes no hard token-limit flag. The harness records reported
token fields and enforces the frozen wall-time limit. If a strict token ceiling
is required, it must be enforced by an API gateway/model provider before the
experiment version is frozen.
