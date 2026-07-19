# Judge Verification Guide

## Fastest path

Requirements:

- Node.js 20 or newer;
- pnpm 10;
- Docker.

From the repository root:

```sh
pnpm install
docker compose up -d postgres
pnpm db:push
pnpm db:seed
pnpm dev
```

Open:

- Dashboard: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3001`
- MCP endpoint: `http://127.0.0.1:3001/mcp`

Check service health:

```sh
curl http://127.0.0.1:3001/health
```

## Connect Codex through remote MCP

Add:

```toml
[mcp_servers.haderach]
url = "http://127.0.0.1:3001/mcp"
```

Alternatively, use the stdio transport:

```toml
[mcp_servers.haderach]
command = "npx"
args = [
  "pnpm@10.15.0",
  "--dir",
  "/absolute/path/to/openAI-hackathon",
  "--filter",
  "@haderach/cloud",
  "mcp:stdio"
]
```

## Core verification commands

```sh
pnpm test
pnpm typecheck
pnpm build
curl http://127.0.0.1:3001/health
```

## MCP workflow to inspect

The core tools are:

1. `start_session`
2. `find_experience`
3. `get_experience`
4. `save_experience`
5. `record_experience_feedback`
6. `update_session`
7. `finish_session`

Additional collaboration operations support repository-scoped questions,
answers, and service incidents.

A useful manual inspection sequence is:

1. Start a repository-scoped session.
2. Search for existing experience with a task and a small token budget.
3. Confirm that search returns compact cards rather than full records.
4. Expand one record.
5. Save a distinct, evidenced finding.
6. Record successful or failed feedback.
7. Confirm the ranking/usage state changes in the dashboard.

## Evaluation verification

Read:

- [Judge-facing evaluation report](02_EVALUATION_REPORT.md)
- [Original recorded results](../docs/EVALUATION_RESULTS.md)
- [Evaluation specification](../docs/EVALUATION_SPEC.md)

When the development-machine artifacts are available, they are located at:

```text
/Users/ericlu/Works/sandbox-oai/agent-haderach-evaluation
```

Those artifacts are local and may not exist in a judge's environment. The
repository should therefore remain independently testable without them.

## Expected current scope

- one shared team/repository context;
- local-first behavior;
- PostgreSQL persistence;
- deterministic lexical and metadata retrieval;
- progressive summary/detail retrieval;
- explicit evidence-backed feedback;
- no backend AI inference;
- no raw chain-of-thought storage.

Authentication and production multi-tenancy are documented follow-on work and
should not be expected from the hackathon MVP.

