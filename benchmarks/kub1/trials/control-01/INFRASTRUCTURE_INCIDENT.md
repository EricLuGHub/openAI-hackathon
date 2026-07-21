# Invalid pre-launch attempt

The trial runner stopped before Codex launched because the host Python version
does not support `tarfile.extractall(filter="data")`. No prompt was submitted,
no model tokens were used, and no solver worktree changes were made.

The runner was updated with a compatibility fallback for the locally generated,
hash-pinned snapshot. This directory is excluded from benchmark statistics. The
control condition restarts from a fresh archive extraction under a new run ID.
