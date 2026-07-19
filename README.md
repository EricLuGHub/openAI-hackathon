# Agent Haderach

**A shared, self-validating experience layer for coding agents.**

Coding agents repeatedly rediscover the same repository workflows, failure modes, and architectural facts. Agent Haderach lets one agent leave compact, evidenced experience that later agents can retrieve, verify, and reinforce—without filling the repository with ever-growing Markdown logs.

The name references Dune's Kwisatz Haderach: an agent can draw on the useful experience of agents that worked before it.

## What the demo proves

- An agent opens a task-scoped session through MCP.
- Retrieval returns a ranked, token-budgeted set of compact experience cards.
- The agent expands only a promising entry, verifies it against current code, and reports whether it helped.
- Successful reuse raises the entry's ranking; stale or failed advice is demoted.
- Agents can also share incidents, questions, and evidenced answers.
- The backend contains no LLM and calls no AI API. The connected coding agent performs extraction and judgment.

## Architecture

```text
Codex ── MCP (HTTP or stdio) ──┐
                               ├── Hono server ── PostgreSQL
Browser ─────── REST API ──────┘        │
                                        └── deterministic ranking + token budgets
```

| Component             | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `apps/server`         | REST API and MCP tools over Streamable HTTP or stdio  |
| `apps/web`            | Live experience, reuse, and session dashboard         |
| `packages/database`   | PostgreSQL persistence, search, ranking, and feedback |
| `packages/schemas`    | Shared Zod contracts                                  |
| `templates/workspace` | Central repository/worktree/task operating contract   |
| `docs`                | Product and implementation specifications             |

## Run locally

Requirements: Node.js 20+, pnpm 10+, and Docker.

```sh
pnpm install
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://127.0.0.1:3000`. The API and remote MCP endpoint run at `http://127.0.0.1:3001` and `/mcp` respectively. PostgreSQL is exposed on port `55432` to avoid common local port conflicts.

## Connect Codex

Add the local remote MCP endpoint:

```toml
[mcp_servers.haderach]
url = "http://127.0.0.1:3001/mcp"
```

Or use the stdio server from this checkout:

```toml
[mcp_servers.haderach]
command = "npx"
args = ["pnpm@10.15.0", "--dir", "/absolute/path/to/openAI-hackathon", "--filter", "@haderach/server", "mcp:stdio"]
```

For a public deployment, set `AGENT_HADERACH_API_SECRET` and send it as a Bearer token. Local development intentionally starts without accounts or multi-tenancy.

## MCP workflow

The main tools are `start_session`, `find_experience`, `get_experience`, `save_experience`, `record_experience_feedback`, `update_session`, and `finish_session`. Collaboration tools add repository-scoped questions, answers, and service incidents.

Experience is progressive: search exposes a short summary and score; `get_experience` exposes cleaned detail only when requested. Raw chain-of-thought is never required or stored.

## Verify

```sh
pnpm test
pnpm typecheck
pnpm build
curl http://127.0.0.1:3001/health
```

The real-repository experiment and repeatable instructions live in [docs/EVALUATION_RESULTS.md](docs/EVALUATION_RESULTS.md).

## Current scope

The MVP intentionally supports one team and one repository context, local-first operation, deterministic lexical/metadata retrieval, and explicit agent feedback. Authentication, multi-tenancy, semantic embeddings, automated background grooming, and hosted deployment are follow-on work.

## Built with Codex

Codex was used as the implementation agent and as both participants in the evaluation. It connected to Agent Haderach through MCP, generated structured experience from verified work, retrieved prior experience in a clean session, and submitted evidence-backed usefulness feedback. Agent Haderach itself remains model-agnostic and makes no AI API calls.

## Why this is not “more Markdown”

Repository documents remain ideal for stable rules. High-volume investigation history is different: committing every finding creates noisy searches and review overhead, cannot rank by proven reuse, and has no lifecycle for stale claims. Agent Haderach provides granular records, compact retrieval, feedback, freshness, and zero-PR contribution while linking every important claim back to evidence.

## License

MIT
