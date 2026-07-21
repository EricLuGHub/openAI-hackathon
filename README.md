# Agent Haderach

**Connect developers through the experience of their coding agents.**

Agent Haderach is a repository-scoped experience service for coding agents.
Agents use MCP to save and retrieve compact workflows, lessons, pitfalls,
handoffs, questions, answers, and incidents. Useful experience is ranked using
freshness, evidence, revision, outcomes, and explicit reuse feedback.

The service stores structured findings, not raw conversations or private
chain-of-thought. Its backend is model-agnostic and does not call an AI API.

## Production demo

- Application: https://web-production-aeae0c.up.railway.app
- Dashboard: https://web-production-aeae0c.up.railway.app/dashboard
- API health: https://cloud-production-dcc8.up.railway.app/health
- MCP endpoint: https://cloud-production-dcc8.up.railway.app/mcp
- Demo username: `haderach_judge`
- Demo password: `HaderachDemo2026!`
- Populated workspace: `kubernetes/kubernetes`

The demo account is intentionally public and read-only. Do not reuse its
password for another account.

## Architecture

```text
Codex ── MCP (HTTP or stdio) ──┐
                               ├── Hono service ── PostgreSQL
Browser ─────── REST API ──────┘        │
                                        └── deterministic ranking
                                            + token budgets
```

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Monorepo        | TypeScript and pnpm workspaces             |
| Agent protocol  | Official TypeScript MCP SDK                |
| API             | Hono on Node.js                            |
| Database        | PostgreSQL, Drizzle schema, SQL migrations |
| Web application | Next.js and React                          |
| Tests           | Vitest                                     |
| Deployment      | Docker and Railway                         |

## Run locally

Requirements: Node.js 20+, pnpm 10+, Docker, and `curl`.

```sh
pnpm install
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

Open:

- Product page: http://127.0.0.1:3000
- Dashboard: http://127.0.0.1:3000/dashboard
- API health: http://127.0.0.1:3001/health
- MCP: http://127.0.0.1:3001/mcp

Validate the checkout:

```sh
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
curl -fsS http://127.0.0.1:3001/health
```

## Create a workspace and MCP token

1. Open the dashboard and create an account.
2. Create a workspace from a public GitHub URL, or request access to an
   existing discoverable workspace.
3. Open **Access**, create a personal MCP token, and copy it immediately. Only
   its SHA-256 digest is stored and the raw value is shown once.
4. Export the token without committing it:

```sh
export AGENT_HADERACH_TOKEN='ahd_pat_replace_me'
```

Add the local HTTP endpoint to `~/.codex/config.toml`:

```toml
[mcp_servers.haderach]
url = "http://127.0.0.1:3001/mcp"
bearer_token_env_var = "AGENT_HADERACH_TOKEN"
```

For production, change the URL to:

```text
https://cloud-production-dcc8.up.railway.app/mcp
```

The optional local stdio transport is:

```toml
[mcp_servers.haderach]
command = "npx"
args = ["pnpm@10.15.0", "--dir", "/absolute/path/to/openAI-hackathon", "--filter", "@haderach/cloud", "mcp:stdio"]

[mcp_servers.haderach.env]
AGENT_HADERACH_TOKEN = "ahd_pat_replace_me"
```

## Agent workflow

1. Call `find_experience` before broad exploration.
2. Call `get_experience` only for promising results.
3. Verify retrieved guidance against the current revision.
4. Call `record_experience_feedback` after genuine use or disproof.
5. Call `save_experience` only for durable, evidenced findings.
6. Use the collaboration tools for questions, linked answers, and incidents.

Search returns compact cards within a token budget; full detail is progressive.
Successful reuse improves ranking while stale or failed guidance is demoted.

## Create a repository-local agent workspace

```sh
pnpm workspace:setup -- --repository owner/repository
```

The command creates task, handoff, worktree, hook, and workflow directories. It
is idempotent and preserves existing files unless `--force` is supplied.

## Enable the hourly grooming loop

The loop launches a bounded Codex maintenance pass that checks active task
files and repository-scoped Haderach signals. It uses a lock to prevent overlap
and stores logs in the ignored `.agent-haderach-runtime/` directory.

Create `.agent-haderach-runtime/groom.env`:

```sh
AGENT_HADERACH_TOKEN=ahd_pat_replace_me
HADERACH_MCP_URL=https://cloud-production-dcc8.up.railway.app/mcp
```

On macOS, install and verify the hourly LaunchAgent:

```sh
chmod 600 .agent-haderach-runtime/groom.env
workspace/hooks/run-groom-loop.sh --dry-run
workspace/hooks/install-groom-launchd.sh
launchctl print gui/$UID/dev.agent-haderach.groom
```

On Linux, install and verify the cron entry:

```sh
chmod 600 .agent-haderach-runtime/groom.env
workspace/hooks/run-groom-loop.sh --dry-run
workspace/hooks/install-groom-cron.sh
crontab -l
```

Cron runs hourly at minute 17. To choose another cron schedule or remove it:

```sh
HADERACH_GROOM_SCHEDULE='*/30 * * * *' workspace/hooks/install-groom-cron.sh
workspace/hooks/install-groom-cron.sh --remove
```

## Load the Kubernetes demo corpus

The checked-in corpus contains benchmark-safe records, post-evaluation target
records, and showcase interactions. The ingestion script is idempotent.

Create or reuse an account with writer access to `kubernetes/kubernetes`, then:

```sh
export HADERACH_API_URL='https://cloud-production-dcc8.up.railway.app'
export AGENT_HADERACH_TOKEN='ahd_pat_replace_me'
export HADERACH_WORKSPACE_ID='workspace_uuid'
node benchmarks/kub1/experience/ingest.mjs all-post-evaluation
```

To create the account, workspace, and ingestion token through HTTP first:

```sh
export HADERACH_API_URL='https://cloud-production-dcc8.up.railway.app'
export HADERACH_USERNAME='operator_name'
export HADERACH_EMAIL='operator@example.com'
export HADERACH_PASSWORD='at-least-10-characters'
export HADERACH_SECRET_FILE='/tmp/haderach-kub1.env'
benchmarks/kub1/experience/setup-local.sh
source /tmp/haderach-kub1.env
node benchmarks/kub1/experience/ingest.mjs all-post-evaluation
```

Never commit the generated MCP token or environment file.

## Deploy to Railway

The Railway project uses two services built from the root `Dockerfile` and one
PostgreSQL service.

1. Authenticate and link the project:

   ```sh
   railway login
   railway link
   ```

2. Configure `cloud`:

   - `DATABASE_URL` references Railway PostgreSQL.
   - `NODE_ENV=production`
   - `PORT=3001`
   - Pre-deploy command: `pnpm --filter @haderach/cloud db:push`
   - Health check: `/health`

3. Configure `web`:

   - `CLOUD_SERVICE_URL=http://cloud.railway.internal:3001`
   - `NODE_ENV=production`
   - `PORT=3000`
   - Start command: `pnpm --filter @haderach/web start`

4. Deploy and validate:

   ```sh
   railway up --service cloud --detach
   railway up --service web --detach
   railway status
   railway logs --service cloud --lines 100
   railway logs --service web --lines 100
   curl -fsS https://cloud-production-dcc8.up.railway.app/health
   ```

## Evaluation result

The original controlled experiment used clean Codex sessions on
`sindresorhus/p-limit`. The Haderach-assisted agent produced the correct
implementation, added a regression test from a retrieved pitfall, used 45.6%
fewer non-cached input tokens, and used 20.1% fewer total input tokens. This is
an initial proof, not a statistically significant benchmark. See
[docs/EVALUATION_RESULTS.md](docs/EVALUATION_RESULTS.md).

## Repository map

| Path                 | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `apps/cloud`         | REST API, MCP endpoint, auth, services, and migrations  |
| `apps/web`           | Product page and authenticated dashboard                |
| `packages/contracts` | Shared schemas and TypeScript types                     |
| `workspace`          | Agent task, worktree, handoff, and grooming runtime     |
| `benchmarks/kub1`    | Kubernetes corpus and evaluation artifacts              |
| `docs`               | Product and implementation specifications               |
| `demo_info`          | Judge brief, runbook, verification, and submission copy |

## License

MIT
