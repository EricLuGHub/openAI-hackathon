#!/usr/bin/env bash
set -euo pipefail

api_url="${HADERACH_API_URL:-http://127.0.0.1:3001}"
secret_file="${HADERACH_SECRET_FILE:-/tmp/haderach-kub1.env}"
cookie_file="$(mktemp "${TMPDIR:-/tmp}/haderach-kub1-cookie.XXXXXX")"
trap 'rm -f "$cookie_file"' EXIT

: "${HADERACH_USERNAME:?Set HADERACH_USERNAME}"
: "${HADERACH_EMAIL:?Set HADERACH_EMAIL}"
: "${HADERACH_PASSWORD:?Set HADERACH_PASSWORD (10+ characters)}"
command -v jq >/dev/null

signup_code="$(curl -sS -o /tmp/haderach-kub1-signup.json -w '%{http_code}' \
  -c "$cookie_file" -H 'content-type: application/json' \
  -d "$(jq -nc --arg username "$HADERACH_USERNAME" --arg email "$HADERACH_EMAIL" --arg password "$HADERACH_PASSWORD" '{username:$username,email:$email,password:$password}')" \
  "$api_url/auth/signup")"
if [[ "$signup_code" == "409" ]]; then
  curl -fsS -c "$cookie_file" -H 'content-type: application/json' \
    -d "$(jq -nc --arg identifier "$HADERACH_USERNAME" --arg password "$HADERACH_PASSWORD" '{identifier:$identifier,password:$password}')" \
    "$api_url/auth/signin" >/dev/null
elif [[ "$signup_code" != "201" ]]; then
  jq . /tmp/haderach-kub1-signup.json >&2
  exit 1
fi

workspace="$(curl -fsS -b "$cookie_file" "$api_url/api/workspaces?q=github:kubernetes/kubernetes" | jq -c 'map(select(.canonical_key == "github:kubernetes/kubernetes" and .role != null))[0] // empty')"
if [[ -z "$workspace" ]]; then
  workspace="$(curl -fsS -b "$cookie_file" -H 'content-type: application/json' \
    -d '{"repositoryUrl":"https://github.com/kubernetes/kubernetes"}' "$api_url/api/workspaces")"
fi

token_json="$(curl -fsS -b "$cookie_file" -H 'content-type: application/json' \
  -d '{"name":"KUB1 ingestion operator"}' "$api_url/api/tokens")"
token="$(jq -r '.token' <<<"$token_json")"
workspace_id="$(jq -r '.id' <<<"$workspace")"

umask 077
{
  printf 'HADERACH_API_URL=%q\n' "$api_url"
  printf 'AGENT_HADERACH_TOKEN=%q\n' "$token"
  printf 'HADERACH_WORKSPACE_ID=%q\n' "$workspace_id"
} >"$secret_file"
printf 'Workspace: %s\nSecrets: %s (mode 600; outside repository)\n' "$workspace_id" "$secret_file"
