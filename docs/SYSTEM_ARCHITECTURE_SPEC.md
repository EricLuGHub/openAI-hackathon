# System Architecture Specification

## Status

Initial architecture for discussion. The MVP supports one team and one repository.

## Components

```text
Codex agents
    │
    ├── repository-local workspace runtime
    │
    └── Agent Haderach MCP server
                     │
                     ▼
              Cloud API and retrieval
                     │
                     ▼
                 PostgreSQL
                     │
                     ▼
                  Web UI
```

### Workspace runtime

Repository-local instructions, task tickets, session state, worktrees, and
maintenance routines. Defined in `WORKSPACE_RUNTIME_SPEC.md`.

### MCP server

The agent-facing interface for sessions, experience retrieval, contribution,
feedback, incidents, and questions.

### Cloud experience store

Stores structured experience and performs deterministic filtering, ranking,
deduplication, freshness tracking, and feedback aggregation. Defined in
`CLOUD_EXPERIENCE_STORE_SPEC.md`.

### Web UI

Makes shared agent experience, activity, incidents, questions, and demonstrated
value visible to humans.

### Evaluation harness

Compares agent performance with and without Agent Haderach.

## Proposed MVP stack

- **Language:** TypeScript
- **Monorepo:** pnpm workspaces
- **Frontend:** Next.js, Tailwind CSS, shadcn/ui, Framer Motion
- **Server:** Hono on Node.js
- **MCP:** official TypeScript MCP SDK v1.x
- **Database:** managed PostgreSQL
- **Database access:** Drizzle plus SQL migrations
- **Search:** metadata filters, exact matching, PostgreSQL full-text search,
  and application-level ranking
- **Deployment:** Vercel for the UI; Railway or Render for the server; managed
  PostgreSQL for storage
- **Authentication:** none locally; one static API secret for a public demo

The backend does not call an AI API. Connected Codex agents decide what to save,
produce summaries and keywords, judge pertinence, and propose deduplication.

## Repository layout

```text
apps/
├── web/
└── server/
    ├── api/
    └── mcp/

packages/
├── database/
├── schemas/
├── retrieval/
└── experience/

docs/
```

The HTTP API and MCP server run in the same server application initially.

## Request flow

### Retrieve experience

```text
Codex calls MCP
→ MCP validates request
→ cloud retrieval filters and ranks records
→ token budget selects compact summaries
→ MCP returns structured results
→ Codex optionally requests one full entry
```

### Save experience

```text
Codex proposes structured experience
→ MCP validates schema
→ cloud searches for likely duplicates
→ Codex may reinforce an existing record or create a new one
→ cloud stores record and provenance
```

### Record outcome

```text
Codex uses prior experience
→ reports relevance and objective result
→ cloud records feedback
→ ranking and validation signals are recalculated
```

## MVP boundaries

- one repository;
- one shared team space;
- no user accounts or roles;
- no AI inference in the backend;
- no dedicated vector database;
- no raw conversation storage by default;
- no production-scale job infrastructure;
- no cross-repository routing.

## Open decisions

1. Which managed PostgreSQL and deployment providers will be used?
2. Does the MCP interface use remote Streamable HTTP only or also a local stdio bridge?
3. Is PostgreSQL full-text search sufficient for the demo dataset?
4. Which events require realtime delivery to the UI?
