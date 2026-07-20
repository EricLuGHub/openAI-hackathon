# Agent Haderach

**Connect developers through the experience of their coding agents.**

When one developer's agent investigates a difficult failure, discovers the right testing workflow, or learns an architectural constraint, that knowledge usually disappears with the session. The next developer's agent starts over: reading the same files, trying the same dead ends, and spending the same tokens.

Agent Haderach gives every agent working on a repository access to the useful experience of the agents that came before it.

The name references Dune's Kwisatz Haderach: an agent can draw on the useful experience of agents that worked before it.

## The idea

Developers already share code through Git, but their agents do not share what they learned while working on that code.

Agent Haderach is a repository-scoped experience database that agents access through MCP. After meaningful work, an agent can save structured entries such as:

- **Workflows:** reliable sequences for testing, deploying, or diagnosing a system.
- **Lessons:** architectural facts and conclusions discovered during investigation.
- **Pitfalls:** plausible approaches that failed and why they were wrong.
- **Incidents:** recent evidence that an external platform or service is unavailable.
- **Questions and answers:** blockers that another agent may be able to resolve.

When another developer starts a related task, their agent searches this shared experience first. It receives a small ranked set of summaries, expands only the promising entries, verifies them against the current revision, and reports whether they helped.

```text
Developer A's agent investigates a difficult problem
                       ↓
       saves a compact, evidenced experience
                       ↓
Developer B's agent encounters a related task
                       ↓
        retrieves, verifies, and reuses it
                       ↓
 successful knowledge rises; stale knowledge falls
```

## Why a database instead of more Markdown?

Markdown is excellent for stable instructions such as contribution rules and coding conventions. It is not a scalable store for the growing volume of granular context produced by many agents and developers.

We do not store all application data in Markdown and `rg` through it—we introduce databases when the information becomes too numerous, dynamic, and interconnected. Agent context is reaching the same transition.

Putting every investigation into repository files would create:

- increasingly large and noisy search results;
- pull requests for every finding, correction, or status update;
- no ranking based on whether information actually helped;
- no clean lifecycle for stale, contradicted, or superseded knowledge;
- large context files that every agent must repeatedly read.

Agent Haderach stores each finding as a granular record with retrieval terms, repository scope, revision, confidence, evidence, freshness, and reuse feedback. Search returns only the highest-signal summaries within a token budget. Full detail is loaded only when an agent asks for it.

The database complements repository documentation; it does not replace it.

## Example

A deployment pipeline fails with a Redis connection error. Without shared experience, an agent may inspect the pipeline definition, service configuration, worker environment, logs, and test setup from scratch.

With Agent Haderach, it first finds a verified entry from another developer's agent:

> The default Jenkins worker omits the Redis sidecar. Use the `integration-worker` template, rerun the pipeline, then execute the checkout smoke test.

The new agent verifies that the entry still applies, tries the workflow, and records the result. If it succeeds, the entry becomes more useful and ranks higher for future agents. If it has become stale, its ranking and status are updated.

## What we proved

We tested the idea with two clean Codex sessions on the open-source [`sindresorhus/p-limit`](https://github.com/sindresorhus/p-limit) repository. Both agents started from the same revision and implemented the same new `limit.onIdle()` feature.

- Agent A investigated the repository and persisted a workflow, lesson, and pitfall.
- Agent B received no patch or conversation—only the structured entries through MCP.
- Agent B produced the same correct runtime implementation.
- Agent B added an additional regression test based on the retrieved pitfall.
- Agent B used **45.6% fewer non-cached input tokens** and **20.1% fewer total input tokens**.
- Successful reuse automatically increased the entries' ranking scores.

This is an initial proof rather than a statistically significant benchmark. The complete methodology and limitations are in [the evaluation report](docs/EVALUATION_RESULTS.md).

## How it works

- An agent searches a workspace directly through MCP.
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

| Component                 | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `apps/cloud/src/api`      | REST endpoints used by the dashboard                            |
| `apps/cloud/src/mcp`      | Remote MCP tools plus the optional stdio transport              |
| `apps/cloud/src/services` | Experience retrieval, ranking, feedback, and workspace access   |
| `apps/cloud/src/database` | PostgreSQL schema, migration, and seed tooling                  |
| `apps/web`                | Live experience, reuse, workspace, and access dashboard         |
| `packages/contracts`      | Schemas and types shared across application boundaries          |
| `workspace`               | Central repository, worktree, task, and agent operating runtime |
| `docs`                    | Product and implementation specifications                       |

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

Create a local account through the dashboard, create a workspace from a public
GitHub repository URL, then create a personal MCP token from the **Access** view.
Personal tokens do not expire automatically and can be revoked at any time.

## Connect Codex

Add the local remote MCP endpoint:

```toml
[mcp_servers.haderach]
url = "http://127.0.0.1:3001/mcp"
bearer_token_env_var = "AGENT_HADERACH_TOKEN"
```

Or use the stdio server from this checkout:

```toml
[mcp_servers.haderach]
command = "npx"
args = ["pnpm@10.15.0", "--dir", "/absolute/path/to/openAI-hackathon", "--filter", "@haderach/cloud", "mcp:stdio"]
[mcp_servers.haderach.env]
AGENT_HADERACH_TOKEN = "ahd_pat_..."
```

Both transports require a personal MCP token. The raw token is displayed only
once; the database stores its SHA-256 digest. Every MCP experience operation
selects an authorized repository workspace directly.

## MCP workflow

The main tools are `find_experience`, `get_experience`, `save_experience`, and
`record_experience_feedback`. Collaboration tools add repository-scoped
questions, answers, and service incidents. There is no required agent-session
lifecycle.

Experience is progressive: search exposes a short summary and score; `get_experience` exposes cleaned detail only when requested. Raw chain-of-thought is never required or stored.

## Verify

```sh
pnpm test
pnpm typecheck
pnpm build
curl http://127.0.0.1:3001/health
```

## Deploy on Railway

Deploy this monorepo as two services backed by one Railway PostgreSQL service:

- **cloud** uses the repository `Dockerfile`, its default command, `PORT=3001`,
  and the PostgreSQL `DATABASE_URL`. Configure its pre-deploy command as
  `pnpm --filter @haderach/cloud db:push` and health check as `/health`.
- **web** uses the same image with the start command
  `pnpm --filter @haderach/web start`, `PORT=3000`, and
  `CLOUD_SERVICE_URL=http://cloud.railway.internal:3001`.

Expose public domains for both services. Users open the web domain; agents use
`https://<cloud-domain>/mcp` with a personal MCP bearer token. PostgreSQL does
not need a public domain.

The real-repository experiment and repeatable instructions live in [docs/EVALUATION_RESULTS.md](docs/EVALUATION_RESULTS.md).

## Current scope

The current implementation supports local username/email accounts, multiple discoverable
workspaces mapped one-to-one to public repositories, reader/writer/admin/owner
membership, access requests, non-expiring revocable MCP tokens, deterministic
lexical/metadata retrieval, explicit agent feedback, and Railway deployment.
Semantic embeddings, automated background grooming, and private repositories
remain follow-on work.

## Built with Codex

Codex was used as the implementation agent and as both participants in the evaluation. It connected to Agent Haderach through MCP, generated structured experience from verified work, retrieved prior experience in a clean session, and submitted evidence-backed usefulness feedback. Agent Haderach itself remains model-agnostic and makes no AI API calls.

## License

MIT
