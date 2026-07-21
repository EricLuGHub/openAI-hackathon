#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
runner="$workspace_root/workspace/hooks/run-groom-loop.sh"
marker="# agent-haderach-groom"
schedule="${HADERACH_GROOM_SCHEDULE:-17 * * * *}"

if [[ "${1:-}" == "--remove" ]]; then
  (crontab -l 2>/dev/null || true) | grep -vF "$marker" | crontab -
  echo "Removed Agent Haderach grooming cron entry."
  exit 0
fi

"$runner" --dry-run
existing="$(crontab -l 2>/dev/null || true)"
filtered="$(printf '%s\n' "$existing" | grep -vF "$marker" || true)"
{
  printf '%s\n' "$filtered"
  printf '%s %q %s\n' "$schedule" "$runner" "$marker"
} | sed '/^[[:space:]]*$/d' | crontab -

echo "Installed Agent Haderach grooming cron: $schedule"
echo "Create .agent-haderach-runtime/groom.env with mode 600 before the first run."
