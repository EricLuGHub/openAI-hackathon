# Indexing Design

## 9. Indexing design

Indexing is a central product capability, not an implementation detail. The
goal is to make context precisely retrievable without forcing the agent to read
whole documents or search every connected system.

### 9.1 Ingestion stages

```text
Connector fetch
  → raw source storage
  → normalization
  → source-specific parsing
  → chunk/segment boundary detection
  → deterministic metadata extraction
  → semantic context extraction
  → entity resolution
  → code-scope linking
  → temporal and lifecycle analysis
  → embedding and lexical indexing
  → relationship creation
  → validation and publication
```

### 9.2 Raw source preservation — Decided

The original imported content, identity, timestamps, and permission metadata
must be retained or referentially addressable. Derived context should always be
auditable against the original source.

### 9.3 Chunking strategy — Proposed

Chunking should be source-aware rather than based only on fixed token counts.

#### Markdown and documentation

- preserve heading hierarchy;
- keep instruction lists together where possible;
- associate nested sections with parent headings;
- extract individual normative statements as context records;
- preserve repository path and applicable directory scope;
- retain links and code references.

#### Source code

- index files, symbols, signatures, docstrings, and structural relationships;
- keep symbol bodies addressable without always embedding entire files;
- associate tests with production symbols using naming, imports, call graphs,
  coverage where available, and model-assisted inference;
- distinguish generated, vendored, and ignored code.

#### Pull requests

- preserve conversation threads;
- associate comments with file paths and line positions;
- distinguish proposal, review request, change, resolution, and final merge state;
- link PRs to commits, issues, and changed symbols;
- give resolved review conclusions more weight than early speculation.

#### Slack

- preserve thread boundaries;
- include enough conversational neighborhood to interpret a message;
- avoid treating isolated messages as decisions;
- identify linked PRs, tickets, paths, symbols, and features;
- allow channel-level retention and access policies.

#### Meeting transcripts

- segment by topic and speaker turns;
- retain timestamp ranges;
- recognize explicit decision language and later corrections;
- distinguish agenda discussion, proposals, decisions, and action items;
- link referenced repositories, features, tickets, and people.

#### Agent sessions

- group events by task phase;
- distinguish observation from inference;
- connect findings to inspected code and executed tests;
- exclude routine or obvious activity;
- prioritize discoveries that were expensive, surprising, or reusable.

### 9.4 Deterministic indexes — Proposed MVP

- organization, user, and space IDs;
- repository and remote URL;
- branch, commit, and revision range;
- path and glob scope;
- symbol names and qualified identifiers;
- document hierarchy;
- timestamps and time ranges;
- authors and teams;
- PR, issue, ticket, and meeting identifiers;
- source type;
- context type and lifecycle status;
- content hash and source revision;
- access-control identifiers;
- exact keyword and full-text search.

### 9.5 Semantic index — Proposed MVP

Embeddings support conceptual retrieval across different vocabulary. Separate
embedding representations may be useful for:

- source segments;
- atomic claims;
- code symbols;
- task descriptions;
- feature/project descriptions.

Open question: use one embedding model and shared vector space initially, or
specialized embeddings for code and natural language.

### 9.6 Structural code index — Proposed

For supported languages, parse code with Tree-sitter or language-native tooling
to capture:

- files;
- classes, functions, methods, types, and constants;
- imports and exports;
- calls and references where reliably available;
- inheritance and implementation relationships;
- tests and likely tested symbols;
- ownership and module boundaries.

For the hackathon, path and symbol extraction may be sufficient without a full
cross-language call graph.

### 9.7 Temporal index — Decided concept, MVP simplified

Context is indexed by when it was stated, when it became applicable, and which
repository revisions support it.

The system should eventually answer:

- What was believed when PR #481 was merged?
- Which constraints apply at the current commit?
- What changed about this subsystem in the last month?
- Which older decision was superseded?

MVP approach:

- record source time;
- record ingestion time;
- attach the closest known repository revision;
- mark context potentially stale when referenced files materially change;
- allow explicit `supersedes` relationships.

### 9.8 Permission index — Decided

Retrieval must filter source-derived context by the requesting user's effective
permissions. A user who cannot view a private Slack channel should not receive
a claim whose disclosure would expose that channel's contents.

Open question: whether a generalized, non-sensitive derived fact may remain
visible when its detailed evidence is restricted. The safe initial policy is
that derived context inherits the union of source restrictions.

### 9.9 Entity resolution — Proposed

The service must recognize that these may refer to the same entity:

- `TenantQueue` in Slack;
- `TenantQueue.dispatch()` in a PR review;
- `services/webhooks/tenant_queue.ts` in the repository;
- “the per-tenant worker” in a meeting.

Resolution techniques:

- exact identifiers and URLs;
- repository symbol table;
- aliases and renames from Git history;
- nearby conversational references;
- model-assisted linking with confidence scores;
- human correction in the UI.

### 9.10 Incremental updates

The index should update incrementally:

- Git webhook triggers changed-file and history processing;
- Slack events or periodic sync process new messages;
- transcript import processes one meeting;
- session completion processes bounded session artifacts;
- source deletion or permission changes propagate to derived records;
- symbol changes trigger revalidation only for affected context.

### 9.11 Duplicate and contradiction handling

Potential duplicates should be clustered, not blindly merged. Contradictory
claims should remain separately traceable until the system has evidence of which
one supersedes the other.

Proposed rules:

- never overwrite original source artifacts;
- consolidate identical instructions while retaining all sources;
- prefer newer accepted decisions over older accepted decisions only when a
  supersession relationship is supported;
- show unresolved contradictions to the agent when material to the task;
- allow human resolution;
- lower trust for unsupported single-agent claims.

---
