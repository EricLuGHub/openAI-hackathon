# Cloud Architecture and Technology Stack

## 13. Cloud architecture

### 13.1 Logical services

```text
Web application
     │
API gateway / application API
     ├── identity and organizations
     ├── spaces and repositories
     ├── retrieval API
     ├── context administration
     └── benchmark/analytics API
     │
Background job queue
     ├── GitHub ingestion
     ├── Slack ingestion
     ├── transcript ingestion
     ├── code parsing
     ├── embedding generation
     ├── context extraction
     └── staleness/revalidation
     │
Storage
     ├── relational metadata and context records
     ├── vector index
     ├── full-text index
     ├── raw artifact object storage
     └── audit/telemetry store
```

### 13.2 Multi-tenancy

Every record must be scoped by organization and, where applicable, space and
repository. Database queries must enforce tenant filters centrally rather than
depending on each caller to remember them.

### 13.3 Event processing

Proposed event types:

- `repository.connected`
- `repository.push.received`
- `pull_request.updated`
- `slack.message.received`
- `transcript.uploaded`
- `agent.session.synced`
- `source.permission.changed`
- `source.deleted`
- `context.candidate.created`
- `context.published`
- `context.invalidated`

Jobs should be idempotent using source IDs and content hashes.

### 13.4 Consistency expectations

- Source ingestion is eventually consistent.
- Permission revocation should propagate with higher priority than ordinary indexing.
- Retrieval should expose index freshness.
- Context records should be versioned rather than mutated without audit history.

---

## 14. Proposed technology stack

This section recommends a fast hackathon stack while preserving an evolution path.

### 14.1 Web application — Proposed

- **Next.js with TypeScript** for the dashboard and application API if using a
  single deployable codebase.
- **Tailwind CSS** and a small component library for rapid UI work.
- Server-rendered authentication and organization routing where convenient.

Alternative: React/Vite frontend plus a separate API. This is less attractive
for the MVP unless the team strongly prefers separation.

### 14.2 Core API and workers — Proposed

Option A, recommended for speed:

- Next.js/TypeScript application API;
- separate TypeScript worker process;
- shared schema and domain package.

Option B, recommended if extraction tooling is easier in Python:

- Next.js frontend;
- FastAPI backend and workers;
- generated API client or shared OpenAPI contract.

Open decision: team language preference and available starter code.

### 14.3 Primary database — Proposed

**PostgreSQL** as the canonical store because it supports:

- organizations and permissions;
- source metadata;
- context records and lifecycle;
- relationships;
- full-text search;
- transactional updates;
- JSON metadata;
- mature hosted deployment options.

Use **pgvector** initially for embeddings. This keeps the MVP operationally
simple and allows hybrid SQL filtering before or alongside vector ranking.

### 14.4 Graph storage — Proposed not to add for MVP

Represent context relationships in PostgreSQL using typed edge tables. A graph
database may be evaluated later if traversal complexity and scale justify it.

Avoid introducing Neo4j merely to make the architecture look more advanced.

### 14.5 Full-text search — Proposed

Use PostgreSQL full-text and trigram search initially. Evaluate OpenSearch or a
dedicated search service only after the MVP demonstrates retrieval needs that
PostgreSQL cannot meet.

### 14.6 Object storage — Proposed

S3-compatible object storage for:

- raw transcript uploads;
- normalized source snapshots;
- large session artifacts;
- benchmark logs;
- generated exports.

For the hackathon, small raw text fixtures may remain in PostgreSQL if that
reduces implementation time.

### 14.7 Queue and background jobs — Proposed

Choose one:

- managed queue from the hosting platform;
- Redis-backed BullMQ for TypeScript;
- Redis-backed Celery/RQ for Python;
- PostgreSQL-backed job runner for minimal infrastructure.

MVP recommendation: a PostgreSQL-backed job mechanism or platform-native queue,
unless Redis already exists in the chosen deployment.

### 14.8 Code parsing — Proposed

- Tree-sitter for file- and symbol-level parsing across selected languages.
- Git CLI or a Git library for history and diffs.
- Begin with the demo repository's primary language.
- Fall back to path and text indexing for unsupported languages.

### 14.9 AI models — Proposed

Use GPT-5.6 visibly and substantively for:

- extraction of atomic context records from discussions and documents;
- classification of proposals, decisions, constraints, and rejected approaches;
- code-scope/entity linking when deterministic linking is insufficient;
- task interpretation and query expansion;
- contradiction and supersession analysis;
- session finding extraction;
- benchmark evaluation only where deterministic assertions are unavailable.

Use an embedding model for semantic indexing. Model ID, cost, and dimensionality
remain an implementation decision and should be recorded in the evaluation.

### 14.10 MCP implementation — Proposed

- Official MCP SDK for TypeScript or Python, matching the backend language.
- Local stdio transport for the hackathon.
- Cloud API accessed over HTTPS with user authorization.
- Responses serialized in concise structured text/JSON to control token usage.

### 14.11 Hosting — Open

Potential simple stack:

- Vercel or equivalent for Next.js;
- managed PostgreSQL with pgvector;
- managed object storage;
- one worker service on a container platform.

Selection criteria:

- fastest reliable deployment;
- public demo availability;
- background-job support;
- secrets management;
- predictable cold starts;
- easy judge access.

### 14.12 Observability — Proposed

- structured logs with request and retrieval IDs;
- tracing across ingestion and retrieval;
- model token and latency accounting;
- MCP call success/failure metrics;
- source freshness and job failure dashboards;
- no raw secrets or unauthorized content in logs.

---
