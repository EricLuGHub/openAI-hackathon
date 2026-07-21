#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
runner="$workspace_root/workspace/hooks/run-groom-loop.sh"
runtime_dir="$workspace_root/.agent-haderach-runtime"
label="dev.agent-haderach.groom"
agents_dir="$HOME/Library/LaunchAgents"
plist="$agents_dir/$label.plist"

if [[ "${1:-}" == "--remove" ]]; then
  launchctl bootout "gui/$UID/$label" 2>/dev/null || true
  if [[ -e "$plist" ]]; then mv "$plist" "$runtime_dir/$label.removed.plist"; fi
  echo "Removed Agent Haderach LaunchAgent."
  exit 0
fi

"$runner" --dry-run
mkdir -p "$agents_dir" "$runtime_dir/logs"
temporary="$(mktemp "$runtime_dir/$label.XXXXXX.plist")"
trap 'if [[ -e "$temporary" ]]; then mv "$temporary" "$runtime_dir/invalid-launch-agent.plist"; fi' EXIT

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
  echo '<plist version="1.0"><dict>'
  echo '<key>Label</key><string>dev.agent-haderach.groom</string>'
  echo '<key>ProgramArguments</key><array>'
  printf '<string>%s</string>\n' "$runner"
  echo '</array>'
  echo '<key>StartInterval</key><integer>3600</integer>'
  printf '<key>WorkingDirectory</key><string>%s</string>\n' "$workspace_root"
  printf '<key>StandardOutPath</key><string>%s/logs/launchd.log</string>\n' "$runtime_dir"
  printf '<key>StandardErrorPath</key><string>%s/logs/launchd-error.log</string>\n' "$runtime_dir"
  echo '</dict></plist>'
} >"$temporary"

plutil -lint "$temporary" >/dev/null
install -m 600 "$temporary" "$plist"
mv "$temporary" "$runtime_dir/installed-launch-agent.plist"
launchctl bootout "gui/$UID/$label" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$plist"

echo "Installed Agent Haderach LaunchAgent: $label (hourly)"
