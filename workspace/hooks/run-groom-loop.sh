#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
runtime_dir="${HADERACH_RUNTIME_DIR:-$workspace_root/.agent-haderach-runtime}"
env_file="${HADERACH_GROOM_ENV_FILE:-$runtime_dir/groom.env}"
log_dir="$runtime_dir/logs"
lock_dir="$runtime_dir/groom.lock"
prompt_file="$workspace_root/workspace/workflows/groom.md"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"
mkdir -p "$log_dir"

if [[ "${1:-}" == "--dry-run" ]]; then
  command -v codex >/dev/null
  [[ -r "$prompt_file" ]]
  printf 'Groom loop is ready.\nWorkspace: %s\nPrompt: %s\nLogs: %s\n' \
    "$workspace_root" "$prompt_file" "$log_dir"
  exit 0
fi

if [[ -r "$env_file" ]]; then
  # The file lives under an ignored runtime directory and must be mode 600.
  # shellcheck disable=SC1090
  source "$env_file"
fi

: "${AGENT_HADERACH_TOKEN:?Set AGENT_HADERACH_TOKEN or create $env_file}"
HADERACH_MCP_URL="${HADERACH_MCP_URL:-${HADERACH_API_URL:+${HADERACH_API_URL%/}/mcp}}"
: "${HADERACH_MCP_URL:?Set HADERACH_MCP_URL (or HADERACH_API_URL) in $env_file}"
command -v codex >/dev/null

if ! mkdir "$lock_dir" 2>/dev/null; then
  printf '%s grooming skipped: another run is active\n' "$(date -u +%FT%TZ)" >>"$log_dir/groom.log"
  exit 0
fi
trap 'rmdir "$lock_dir"' EXIT

run_log="$log_dir/groom-$(date -u +%Y%m%dT%H%M%SZ).log"
prompt="$(cat "$prompt_file")

This is an unattended, bounded maintenance run. Work only inside $workspace_root/workspace.
Do not edit application source, deploy, commit, push, create accounts, or expose credentials.
Use the Haderach MCP tools to inspect repository-scoped questions and experience when useful.
Update only existing workspace task or handoff files when there is an evidence-backed state change.
If there is nothing actionable, report that fact and exit successfully."

codex exec \
  --ephemeral \
  --sandbox workspace-write \
  --cd "$workspace_root" \
  -c "mcp_servers.haderach.url=\"$HADERACH_MCP_URL\"" \
  -c 'mcp_servers.haderach.bearer_token_env_var="AGENT_HADERACH_TOKEN"' \
  "$prompt" >>"$run_log" 2>&1

printf '%s grooming completed: %s\n' "$(date -u +%FT%TZ)" "$run_log" >>"$log_dir/groom.log"
