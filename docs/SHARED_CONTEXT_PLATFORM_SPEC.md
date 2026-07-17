# Shared Context Platform: Product and Technical Specification

> Working document. This specification captures the current product direction,
> proposed implementation, unresolved questions, and potential future scope. It
> is intentionally more detailed than the hackathon MVP.

## Document status

- **Working product name:** ContextDB (placeholder)
- **Product category:** Shared context infrastructure for software teams and AI coding agents
- **Primary interface:** Cloud service accessed by an MCP server and supporting integrations
- **Primary hackathon client:** Codex
- **Target hackathon track:** Developer Tools
- **Status:** Discovery and architecture definition

### Decision labels

This document uses the following labels:

- **Decided:** central to the current product direction.
- **Proposed:** recommended default that still needs validation.
- **Open:** requires discussion or experimentation.
- **Later:** valuable, but outside the first implementation.

---

## 1. Executive summary

Software repositories preserve code but do not preserve all of the understanding
required to work on that code. Important context is distributed across large
`AGENTS.md` and `CLAUDE.md` files, source code, pull requests, commit history,
Slack conversations, meetings, tickets, incident reports, developer knowledge,
and previous AI-agent sessions.

Coding agents repeatedly rediscover this information. Different developers and
their agents perform overlapping searches, read the same files, repeat failed
approaches, miss historical constraints, and consume time and tokens rebuilding
an understanding that somebody on the team already developed.

ContextDB is a cloud-hosted, shared, continuously updated context infrastructure
for a repository or engineering space. It ingests organizational knowledge,
indexes it across semantic, structural, temporal, and provenance dimensions,
and makes the smallest useful set of context available to coding agents through
MCP.

The system is designed to make context:

- shared across developers and agents;
- automatically synchronized rather than manually maintained;
- precisely searchable by task, repository, code location, symbol, feature, and time;
- traceable to its original source;
- aware of whether information is current, disputed, or superseded;
- permission-aware;
- compact enough to reduce unnecessary model context;
- useful across sessions, machines, branches, and supported agent clients.

The core product promise is:

> Every coding agent starts with the relevant understanding accumulated by the
> team, rather than rediscovering the repository from scratch.

An alternative short description is:

> Git shares the code. ContextDB shares and indexes everything the team learned
> while building it.

---

## 2. Problem definition

### 2.1 Repository instructions do not scale cleanly

Teams increasingly store agent guidance in files such as `AGENTS.md`,
`CLAUDE.md`, rules files, READMEs, and internal design documents. These files are
useful, but they have limitations:

- they grow into large, expensive context blocks;
- their instructions cover scopes ranging from the whole organization to one function;
- duplicated instructions can disagree;
- obsolete rules are rarely removed reliably;
- the agent may load irrelevant instructions for the current task;
- developers must know where the relevant document lives;
- knowledge remains document-shaped rather than task-shaped;
- much of the real rationale never reaches these files.

### 2.2 Important engineering knowledge lives outside the repository

The reason behind an implementation may exist only in:

- a Slack thread;
- an architecture meeting transcript;
- a pull-request review comment;
- a rejected pull request;
- a ticket discussion;
- an incident retrospective;
- a developer's local investigation;
- an earlier coding-agent session.

The code normally reveals what exists. It does not always reveal why it exists,
what alternatives failed, or which external constraints must remain true.

### 2.3 Agent knowledge does not compound

An agent can spend thousands of tokens learning that:

- a particular test requires a local service;
- a seemingly unused function is called dynamically;
- a subsystem has a non-obvious concurrency constraint;
- an obvious implementation was rejected in an earlier PR;
- a flaky test has a known root cause.

That discovery is usually trapped inside one conversation. The next agent pays
the same discovery cost.

### 2.4 Existing search is not enough

Keyword search and vector similarity can retrieve related text, but engineering
context also requires answers to questions such as:

- Does this statement apply to the current repository and branch?
- Does it apply globally, to one directory, or to one symbol?
- Was it a proposal, a final decision, or an abandoned idea?
- Was it superseded by a later decision?
- What evidence supports it?
- Does the requesting user have permission to view its source?
- Is it important enough to spend context tokens on for this task?

---

## 3. Product thesis

### 3.1 Primary thesis — Decided

A shared and well-indexed context layer can reduce repeated repository
rediscovery and help coding agents perform complex work faster, with fewer
tokens and fewer context-related mistakes.

### 3.2 Supporting hypotheses — To validate

1. A meaningful portion of coding-agent exploration repeats work performed by
   previous developers or agents.
2. Historical decisions and operational findings improve task correctness when
   retrieved at the right time.
3. Task-specific context can outperform large, always-loaded instruction files
   while using fewer tokens.
4. Developers will adopt the system if ingestion and contribution are mostly
   automatic.
5. Evidence and freshness indicators can make shared agent-generated memory
   trustworthy enough to influence coding work.
6. Context accumulated across a team becomes more valuable over time.

### 3.3 Hackathon claim — Proposed

For one controlled repository task, Codex with ContextDB will:

- consume fewer input tokens;
- perform fewer exploratory searches and file reads;
- reach passing tests faster;
- satisfy more hidden historical constraints;
- avoid at least one previously documented failed approach;

than an otherwise equivalent clean Codex session without ContextDB.

---

## 4. Product boundaries

### 4.1 What the product is — Decided

- Shared context infrastructure for a repository, project, or organization.
- A cloud database and retrieval service, not merely a local Markdown utility.
- A multi-source index of engineering knowledge.
- An automatic synchronization layer for code and collaboration sources.
- An MCP-accessible context service for coding agents.
- A persistent memory shared across developers and agent sessions.
- A task-aware retrieval system that observes a configurable token budget.
- A provenance and lifecycle system for engineering knowledge.

### 4.2 What the product is not — Decided

- Not only a vector database.
- Not only semantic search over Slack and Markdown.
- Not a replacement for Git.
- Not a general enterprise search product in the MVP.
- Not primarily a documentation compiler.
- Not a system that requires developers to manually rewrite all knowledge into
  a new format.
- Not a system that treats every conversation or agent statement as fact.
- Not a system that gives every agent unrestricted access to every team source.
- Not an autonomous code-writing agent.

### 4.3 Relationship to existing files

`AGENTS.md`, `CLAUDE.md`, and related documents remain valid input sources.
ContextDB indexes their individual instructions and associates them with scope,
source, revision, and priority. It does not require teams to delete these files.

The long-term product may optionally generate or validate repository guidance,
but document generation is not the central concept.

---

## 5. Users and stakeholders

### 5.1 Individual developer

Needs an agent to become productive in an unfamiliar subsystem without spending
most of the session on repository archaeology.

### 5.2 Experienced repository maintainer

Wants important architectural constraints and hard-earned knowledge to be used
without repeatedly explaining them to every developer and agent.

### 5.3 New team member

Needs current, scoped explanations rather than an overwhelming set of documents
and historical conversations.

### 5.4 Engineering lead

Wants engineering decisions, failed approaches, and operational practices to
remain discoverable and to understand where context gaps cause mistakes.

### 5.5 Security or platform administrator

Needs source permissions, auditability, retention controls, secret filtering,
and visibility into which context is delivered to which agent.

### 5.6 AI coding agent

Needs a stable interface for retrieving relevant context, inspecting evidence,
and allowing useful session outcomes to improve shared memory.

---

## 6. Core user journeys

### 6.1 Connect a repository

1. A team creates an organization and repository space in the web application.
2. An administrator connects a GitHub repository.
3. ContextDB ingests the current tree, documentation, selected Git history, pull
   requests, reviews, and issues.
4. The service builds searchable records and code-scope relationships.
5. The dashboard displays ingestion progress, sources, errors, and context coverage.

### 6.2 Add collaboration context

1. An administrator connects Slack or uploads an exported channel for the MVP.
2. The administrator selects permitted channels and retention rules.
3. A meeting transcript provider or transcript file is connected.
4. Messages and transcript segments are indexed with participants, time,
   conversation/thread structure, and source permissions.
5. The system links discussions to repositories, features, PRs, paths, and symbols
   where evidence permits.

### 6.3 Install the Codex integration

1. The developer installs or configures the ContextDB MCP server.
2. The developer authenticates through a browser or device flow.
3. The local repository remote and current revision identify the repository space.
4. On a trusted project, supporting Codex configuration or hooks enable automatic
   session synchronization where available.
5. The MCP server communicates with the cloud API; the local client does not hold
   the entire index.

### 6.4 Start a coding task

1. The developer gives Codex a normal task.
2. The integration identifies the repository, branch, revision, user, and task.
3. ContextDB retrieves a small task-relevant working set.
4. Codex receives constraints, decisions, known failures, procedures, related
   code locations, previous findings, and evidence references.
5. Codex can request deeper context if necessary.
6. Retrieval and use are logged for later evaluation.

### 6.5 Accumulate knowledge automatically

1. Codex performs its normal investigation and implementation.
2. At supported lifecycle points, the integration submits bounded session
   artifacts or a session summary to the cloud service.
3. GPT-5.6 or another extraction process identifies candidate findings.
4. The service checks novelty, evidence, scope, conflicts, sensitivity, and
   repository revision.
5. Accepted candidates become searchable with an appropriate trust status.
6. Future developers and agents can retrieve them automatically.

### 6.6 Continue another developer's investigation

1. Developer A's session discovers a non-obvious behavior but does not finish the task.
2. The discovery and current work state are persisted.
3. Developer B starts a clean session on the same repository or feature space.
4. ContextDB retrieves the prior finding because it is relevant to Developer B's task.
5. Developer B's agent continues from the team's accumulated understanding.

### 6.7 Inspect and correct context

1. A developer opens the context supplied for a task.
2. The UI shows each claim, its scope, status, and original evidence.
3. The developer confirms, disputes, edits, supersedes, or restricts a finding.
4. The update is audited and affects future retrieval.

---

## 7. Context sources

### 7.1 Repository sources — MVP

- `AGENTS.md` files at every repository level.
- `CLAUDE.md` files and other configured agent-rule files.
- README files.
- architecture and design documents.
- source files and test files.
- package manifests and scripts.
- repository directory structure.
- symbols and symbol relationships where language parsing is supported.
- Git commits and commit messages.
- branches and tags.

### 7.2 GitHub sources — MVP or near-MVP

- pull-request title and description;
- changed files;
- review comments;
- review status;
- discussion threads;
- linked issues;
- commit association;
- merged/closed/rejected status;
- issue descriptions and comments.

### 7.3 Slack sources — MVP through fixture/export; live integration later

- selected channels;
- message threads;
- timestamps;
- participants;
- links to GitHub objects;
- code paths, symbol names, ticket IDs, and feature names mentioned;
- emoji or explicit signals that may indicate agreement, with low evidentiary
  weight unless corroborated.

### 7.4 Meeting sources — MVP through transcript upload

- transcript segments;
- speakers;
- timestamps;
- meeting title and date;
- agenda and linked artifacts;
- explicit decisions;
- open questions;
- rejected alternatives;
- action items.

### 7.5 Agent-session sources — MVP limited, fuller support later

- task description;
- repository revision;
- files and symbols inspected;
- relevant commands and tool calls;
- test results;
- errors;
- patches or changed files;
- explicit conclusions;
- approaches attempted;
- unresolved questions;
- final result and evaluation outcome.

### 7.6 Later sources

- Linear, Jira, and other issue trackers;
- Notion, Confluence, Google Drive, and internal wikis;
- incident-management platforms;
- observability and error-tracking systems;
- deployment events and feature-flag history;
- code ownership directories;
- customer-support escalations;
- design files and API catalogs.

---

## 8. Context model and ontology

The system stores original source material and derived context records. Derived
records must never erase provenance or become indistinguishable from source truth.

### 8.1 Source artifact

An immutable or versioned representation of imported material.

Examples:

- Markdown file at a Git revision;
- Slack message and thread;
- meeting transcript segment;
- PR review comment;
- commit;
- agent-session event.

Required fields:

```yaml
id: source_123
organization_id: org_1
space_id: space_backend
source_type: slack_message
external_id: workspace/channel/timestamp
author_identity: user_42
occurred_at: 2026-07-17T14:30:00Z
ingested_at: 2026-07-17T14:31:00Z
content: "..."
content_hash: sha256:...
permissions_ref: acl_99
metadata: {}
```

### 8.2 Context record

An atomic unit of potentially useful engineering knowledge derived from one or
more source artifacts.

Proposed record types:

- `instruction`: explicit direction for agents or developers;
- `constraint`: behavior or boundary that must remain true;
- `architecture`: structural explanation of a subsystem;
- `decision`: accepted choice and, where known, its rationale;
- `proposal`: suggested but not accepted approach;
- `rejected_approach`: approach deliberately not chosen;
- `failure_mode`: known way a system or workflow fails;
- `procedure`: commands or steps for development, testing, deployment, or recovery;
- `convention`: local style or implementation pattern;
- `dependency`: relationship to another component or external service;
- `ownership`: responsible person or team;
- `observation`: evidenced but not necessarily normative behavior;
- `agent_finding`: discovery proposed by an agent session;
- `work_state`: current status, blocker, or handoff for active work;
- `question`: important unresolved uncertainty;
- `deprecation`: behavior or instruction being retired.

Example:

```yaml
id: ctx_481
space_id: space_backend
type: constraint
title: Preserve webhook ordering within a tenant
claim: Webhook processing may be parallel across tenants but must remain ordered within each tenant.
scope:
  repositories: [acme/backend]
  branches: [main]
  paths: [services/webhooks/**]
  symbols: [TenantQueue.dispatch]
  features: [webhook-concurrency]
validity:
  status: active
  valid_from_revision: 31ac1ef
  valid_to_revision: null
trust:
  status: corroborated
  confidence: 0.94
  created_by: extraction_pipeline
evidence:
  - source_id: meeting_2026_05_14_segment_19
  - source_id: slack_webhooks_thread_882
  - source_id: github_pr_481
relationships:
  - type: supersedes
    target: ctx_301
```

### 8.3 Context lifecycle

Proposed knowledge states:

```text
candidate
  → observed
  → corroborated
  → verified
  → stale
  → superseded
  → rejected
  → archived
```

These states do not have to form one strict linear progression. A human may
verify a candidate immediately; a code change may make a verified record stale.

### 8.4 Claim versus source

The database must distinguish:

- “A participant proposed Kafka” from “The team decided to use Kafka.”
- “An agent inferred this behavior” from “A test demonstrates this behavior.”
- “This was true at commit A” from “This is true at the current revision.”

### 8.5 Scope hierarchy

Context may apply to one or more scopes:

```text
organization
└── engineering space
    └── repository
        ├── branch or revision range
        ├── feature/project
        └── directory
            └── file
                └── symbol
```

More specific context normally outranks general context when both apply, unless
the general record is a hard organization-level policy.

### 8.6 Relationships

Proposed relationship types:

- `applies_to`
- `implemented_by`
- `introduced_by`
- `discussed_in`
- `decided_in`
- `validated_by`
- `contradicts`
- `supersedes`
- `depends_on`
- `caused_by`
- `blocks`
- `related_to`
- `derived_from`
- `used_successfully_in`
- `invalidated_by`

---

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

## 10. Retrieval and context assembly

### 10.1 Retrieval objective

Given a task, user, repository state, and context budget, return the smallest
set of current and authorized context that maximizes the agent's probability of
completing the task correctly.

Conceptually:

```text
maximize expected task correctness
subject to:
  context tokens <= budget
  user has source permission
  minimum evidence threshold is met
  stale context is marked or excluded
```

### 10.2 Retrieval request

```json
{
  "organization": "acme",
  "space": "backend",
  "repository": "acme/backend",
  "branch": "feature/webhook-concurrency",
  "revision": "91bc21",
  "task": "Parallelize webhook processing without breaking delivery guarantees",
  "paths": ["services/webhooks"],
  "open_files": [],
  "budget_tokens": 1500,
  "user_id": "user_42"
}
```

### 10.3 Task interpretation

GPT-5.6 or a smaller task-analysis component identifies:

- intent: investigate, change, debug, review, test, or explain;
- concepts and synonyms;
- likely repositories, paths, and symbols;
- feature/project associations;
- risk areas such as security, migration, concurrency, or external APIs;
- preferred context types.

The original task must remain part of the retrieval query. Model-generated
interpretation should expand it, not replace it.

### 10.4 Candidate generation

Candidates come from multiple retrieval paths:

- full-text/keyword search;
- semantic similarity;
- exact path and symbol lookup;
- feature/project membership;
- graph neighbors of relevant symbols and records;
- recent work state for the same branch or task;
- applicable inherited instructions;
- known failures associated with likely code scope;
- history linked to touched or likely touched files.

### 10.5 Filtering

Remove or flag candidates based on:

- permissions;
- repository and branch mismatch;
- explicit invalidation;
- source deletion;
- lifecycle status;
- excessive staleness;
- low evidence quality;
- duplicate content;
- configured data-classification rules.

### 10.6 Ranking — Proposed

A first implementation may use a weighted ranker:

```text
score =
    semantic relevance       × 0.25
  + path/symbol relevance    × 0.20
  + context-type priority    × 0.15
  + trust/evidence quality   × 0.15
  + temporal freshness       × 0.10
  + task-outcome usefulness  × 0.10
  + source authority         × 0.05
```

Hard constraints, security rules, known rejected approaches, and required test
procedures may receive explicit boosts.

Weights are hypotheses, not settled design.

### 10.7 Context budget packing

The system should not return the top N records without regard to size. It should
pack a diverse, high-value working set within a token budget.

Priority order for code-changing tasks:

1. mandatory organization and repository instructions;
2. safety and security constraints;
3. scoped behavioral and architectural constraints;
4. known failed or rejected approaches;
5. required validation procedures;
6. recent relevant work state and findings;
7. background explanation;
8. additional source excerpts.

The context response initially includes compact claims and evidence references.
The agent can inspect full evidence only when needed.

### 10.8 Example context response

```yaml
context_id: retrieval_921
repository_revision: 91bc21
token_estimate: 1082

constraints:
  - id: ctx_481
    claim: Processing may be parallel across tenants but must be ordered within a tenant.
    scope: services/webhooks/**
    status: verified
    evidence_refs: [meeting:arch-2026-05-14@12:31, pr:481]

rejected_approaches:
  - id: ctx_512
    claim: A single unrestricted worker pool caused retry reordering.
    status: corroborated
    evidence_refs: [pr:481, test:webhook-ordering]

procedures:
  - claim: Run the ordering and retry integration suites after changing dispatch.
    commands:
      - pnpm test webhook:ordering
      - pnpm test webhook:retry

recent_findings:
  - claim: The current test suite does not cover retry ordering after worker restart.
    status: agent_observed
    evidence_refs: [session:812, file:test/webhooks/ordering.test.ts]

warnings:
  - One older global sequential-processing decision has been superseded.
```

### 10.9 Progressive disclosure

The agent should receive compact context first and request more only when needed:

- summary claim;
- supporting excerpt;
- full thread or transcript segment;
- linked code or PR context.

### 10.10 Feedback and outcome learning — Later or partial MVP

Record:

- which context records were retrieved;
- which were inspected in depth;
- which were cited or used by the agent;
- task result;
- tests passed;
- human feedback;
- whether a record caused confusion or was stale.

This data can improve ranking without treating correlation as proof of truth.

---

## 11. Automatic knowledge accumulation

### 11.1 Desired behavior — Decided

Developers should not need to manually maintain the shared context database during
normal work. Relevant information should update through connected sources and
agent lifecycle integrations.

### 11.2 Important protocol boundary

The MCP server can connect Codex to the cloud and expose tools and resources. An
MCP server does not inherently observe every private reasoning step or unrelated
tool call made by an agent. Truly automatic session capture therefore requires
one or more of:

- Codex lifecycle hooks;
- a Codex plugin or project configuration;
- bounded telemetry or session events explicitly authorized by the user;
- an agent wrapper or SDK integration;
- final-session extraction initiated by a lifecycle event;
- explicit MCP calls encouraged by agent instructions as a fallback.

For the hackathon, the installation may bundle MCP configuration with hooks so
the experience still feels automatic.

### 11.3 Candidate extraction

At an appropriate lifecycle point, the service receives a bounded session artifact
and extracts candidates answering questions such as:

- What was surprisingly difficult to learn?
- What would save the next developer meaningful investigation time?
- What behavior was demonstrated by code or tests?
- Which attempted approach failed, and why?
- What remains unresolved?
- Which commands or environment requirements were necessary?

### 11.4 Admission pipeline

```text
Candidate finding
  → sensitivity/secret scan
  → scope identification
  → evidence attachment
  → novelty and duplicate search
  → contradiction search
  → revision association
  → confidence/status assignment
  → publish, quarantine, or discard
```

### 11.5 Admission rules — Proposed

Automatically publish only when:

- the finding is scoped to a known repository or project;
- it has at least one inspectable evidence reference;
- it contains no detected secret or forbidden sensitive content;
- it is not merely a restatement of obvious source code;
- its confidence and source type are disclosed;
- it does not silently overwrite contradictory knowledge.

Otherwise, keep it as a private session artifact, a candidate requiring review,
or discard it.

### 11.6 Human control

Teams should configure:

- whether raw session content is uploaded;
- whether only extracted findings are uploaded;
- source retention periods;
- repositories and paths excluded from collection;
- whether agent findings require human approval;
- which teams can view or correct records;
- whether users can opt out for a session.

---

## 12. MCP server design

### 12.1 Role

The MCP server is the agent-facing gateway to the cloud context service. It:

- authenticates the user;
- identifies or accepts the current repository context;
- retrieves task-relevant context;
- permits progressive evidence inspection;
- exposes targeted search when automatic retrieval is insufficient;
- submits permitted session artifacts or findings;
- reports retrieval feedback and task outcomes;
- enforces response-size and token budgets.

### 12.2 Transport — Proposed

- Local stdio MCP server for simple installation and repository detection.
- The local process communicates with the cloud over HTTPS.
- Later, a remote MCP endpoint may support clients that prefer hosted MCP.

Reasons to begin with a local bridge:

- easy access to repository remote, branch, revision, and working directory;
- cloud credentials remain user-scoped;
- works with local Codex workflows;
- permits local redaction or path filtering before data leaves the machine.

### 12.3 Authentication — Proposed

- Browser-based OAuth or device authorization for users.
- Short-lived access token stored using the client's secure credential mechanism.
- Organization and space membership resolved by the cloud service.
- Repository remote maps to an authorized space.
- Service credentials are never placed in prompts or MCP results.

### 12.4 Minimal MCP tool surface

#### `get_task_context`

Primary operation. Retrieves a compact task-specific context packet.

```json
{
  "task": "Fix duplicate webhook delivery",
  "repository": "auto",
  "revision": "auto",
  "paths": ["services/webhooks"],
  "budget_tokens": 1500
}
```

#### `inspect_context`

Fetches evidence or additional detail for one returned record.

```json
{
  "context_id": "ctx_481",
  "detail": "evidence"
}
```

#### `search_context`

Performs targeted search when task retrieval does not answer a specific question.

```json
{
  "query": "Why must webhook processing preserve tenant ordering?",
  "scope": {
    "paths": ["services/webhooks/**"]
  },
  "limit": 5
}
```

#### `sync_session`

Submits an authorized, bounded session summary or lifecycle artifact. This may be
called by a hook rather than deliberately by the agent.

```json
{
  "task": "Fix duplicate webhook delivery",
  "revision_before": "91bc21",
  "revision_after": "working-tree",
  "summary": "...",
  "changed_paths": ["services/webhooks/consumer.ts"],
  "tests": [{"command": "pnpm test webhook:retry", "result": "passed"}]
}
```

#### `report_context_feedback` — Optional MVP

Records that context was helpful, incorrect, stale, or irrelevant.

### 12.5 MCP resources — Open

Potential read-only resources:

- `contextdb://spaces/{space}/summary`
- `contextdb://repositories/{repo}/instructions`
- `contextdb://context/{context_id}`
- `contextdb://sessions/{session_id}/handoff`

Tools alone are likely sufficient for the MVP. Resources may improve browsing
and compatibility but should not inflate the surface prematurely.

### 12.6 Tool annotations and approvals

- Retrieval operations are read-only.
- Session synchronization writes shared data and must be clearly annotated.
- Organization settings determine whether permitted synchronization can occur
  automatically or requires approval.
- Destructive operations such as deleting context are excluded from the agent
  tool surface in the MVP.

### 12.7 Error behavior

The MCP server should degrade safely:

- if unauthenticated, return a login instruction without blocking ordinary Codex work;
- if the repository is unknown, return setup guidance;
- if the cloud is unavailable, return no context rather than stale unmarked context;
- if a user lacks permission, reveal neither content nor sensitive metadata;
- if revision matching fails, mark context as potentially stale;
- if retrieval exceeds the budget, truncate by ranked context unit rather than
  cutting text arbitrarily.

---

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

## 15. Database design

### 15.1 Proposed core tables

#### Identity and tenancy

- `organizations`
- `users`
- `organization_memberships`
- `spaces`
- `space_memberships`
- `repositories`
- `repository_connections`

#### Sources

- `source_connections`
- `source_artifacts`
- `source_versions`
- `source_acl_bindings`
- `ingestion_cursors`
- `ingestion_jobs`

#### Code model

- `repository_revisions`
- `code_files`
- `code_symbols`
- `code_relationships`
- `symbol_aliases`

#### Context model

- `context_records`
- `context_record_versions`
- `context_evidence`
- `context_scopes`
- `context_relationships`
- `context_embeddings`
- `context_status_events`

#### Agent activity

- `agent_sessions`
- `session_artifacts`
- `session_findings`
- `task_runs`
- `task_outcomes`

#### Retrieval and evaluation

- `retrieval_requests`
- `retrieval_results`
- `context_usage_events`
- `context_feedback`
- `benchmark_runs`
- `benchmark_assertions`

#### Security and audit

- `audit_events`
- `data_retention_policies`
- `redaction_events`

### 15.2 Example `context_records` fields

```text
id
organization_id
space_id
record_type
title
claim
status
confidence
authority_level
valid_from_time
valid_to_time
valid_from_revision
valid_to_revision
created_by_type
created_by_id
created_at
updated_at
```

### 15.3 Example `context_scopes` fields

```text
id
context_record_id
repository_id
branch_pattern
path_pattern
symbol_id
feature_key
scope_strength
```

### 15.4 Example `context_evidence` fields

```text
id
context_record_id
source_artifact_id
source_version_id
excerpt_start
excerpt_end
support_type
support_strength
created_at
```

### 15.5 Versioning strategy

- Source versions are immutable.
- Context edits create new record versions.
- Status changes are recorded as events.
- Evidence references point to immutable source versions.
- Deletions use tombstones until retention policy permits physical deletion.
- Retrieval logs record the exact context-record version returned.

---

## 16. Web UI design

The UI should make an invisible infrastructure product understandable and
trustworthy. It should not look like a generic chatbot.

### 16.1 Primary navigation

```text
Organization switcher
├── Overview
├── Spaces
├── Sources
├── Context Explorer
├── Agent Sessions
├── Evaluations
└── Settings
```

### 16.2 Organization overview

Purpose: communicate value and system health.

Components:

- connected repositories and spaces;
- active developers/agents;
- context records by type and status;
- source freshness;
- recent shared findings;
- context reuse count;
- estimated discovery tokens/time avoided;
- ingestion failures and permission warnings.

### 16.3 Space overview

Shows one repository or feature space:

- repository and active branches;
- connected Slack channels and meetings;
- current features/projects;
- recently changed context;
- top referenced symbols and directories;
- unresolved contradictions;
- stale context requiring review;
- recent agent sessions and work state.

### 16.4 Context Explorer

The central search and debugging interface.

Layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Search: "webhook ordering"             [Filters]        │
├───────────────────┬──────────────────────────────────────┤
│ Results           │ Selected context record              │
│                   │                                      │
│ Constraint        │ Preserve per-tenant ordering         │
│ Decision          │                                      │
│ Failed approach   │ Status: verified                     │
│ Agent finding     │ Scope: services/webhooks/**          │
│                   │ Valid at: main@91bc21                │
│                   │                                      │
│                   │ Evidence timeline                    │
│                   │ Meeting → Slack → PR → Test          │
└───────────────────┴──────────────────────────────────────┘
```

Filters:

- repository and space;
- branch/revision;
- path or symbol;
- context type;
- lifecycle status;
- source type;
- author/team;
- time range;
- confidence;
- stale/current;
- used by agent.

### 16.5 Context lineage view

This is a potential hero visualization for the demo:

```text
Architecture meeting
        │ proposed
        ▼
Slack clarification
        │ accepted
        ▼
PR #481 implementation ───→ TenantQueue.dispatch
        │                              │
        ▼                              ▼
Integration test               Current Codex task
```

Selecting a node opens the source at the relevant timestamp, thread, PR comment,
commit, file, or session event.

### 16.6 Agent session view

Shows:

- task and repository revision;
- baseline or ContextDB-enabled run;
- context automatically supplied;
- context inspected later;
- files explored;
- tests and result;
- candidate findings extracted;
- findings published or rejected;
- token, tool-call, and timing metrics.

### 16.7 Evaluation dashboard

Side-by-side baseline and enhanced runs:

| Metric | Baseline Codex | Codex + ContextDB |
|---|---:|---:|
| Input tokens | measured | measured |
| Time to first edit | measured | measured |
| Exploratory tool calls | measured | measured |
| Files read | measured | measured |
| Total completion time | measured | measured |
| Public tests passed | measured | measured |
| Hidden assertions passed | measured | measured |
| Historical constraints followed | measured | measured |

The UI should link every claim to raw run artifacts.

### 16.8 Source management

- connect/disconnect source;
- select repositories, channels, and scopes;
- show last synchronization time;
- show permission behavior;
- upload transcript fixtures;
- retry failed ingestion;
- preview what will be indexed;
- configure retention.

### 16.9 Context administration

- verify or dispute a record;
- mark superseded;
- change scope;
- attach additional evidence;
- restrict visibility;
- remove sensitive content;
- review agent-generated candidates;
- inspect audit history.

---

## 17. Security, privacy, and trust

### 17.1 Threats

- secrets captured from source or session output;
- cross-tenant data leakage;
- context derived from private channels exposed to unauthorized users;
- prompt injection stored as durable memory;
- incorrect agent finding treated as fact;
- obsolete guidance causing damaging edits;
- malicious developer poisoning shared context;
- source deletion not propagating;
- overly broad session telemetry;
- model provider receiving data outside organizational policy.

### 17.2 Initial controls

- strict organization and space scoping in every query;
- source-derived ACL filtering;
- encryption in transit and at rest;
- secret scanning before publication;
- configurable excluded paths/channels;
- immutable provenance;
- visible trust and lifecycle states;
- no silent replacement of contradictory facts;
- audit log for context creation, access, edits, and deletion;
- minimum evidence requirement for automatically shared findings;
- safe default: no raw chain-of-thought collection;
- retention and deletion propagation.

### 17.3 Prompt-injection handling

Imported text is untrusted data. The extraction pipeline should:

- treat source content as material to analyze, not instructions to follow;
- separate system extraction instructions from source text;
- label source-derived instructions by authority and scope;
- refuse to convert arbitrary external instructions into organization policy;
- scan candidate records for suspicious agent-directed content;
- require stronger evidence or review for executable procedures and security-sensitive instructions.

### 17.4 Data minimization

- retrieve claims rather than full conversations by default;
- upload only authorized session artifacts;
- avoid storing private model reasoning;
- redact secrets before model processing where possible;
- permit customer-controlled retention;
- avoid duplicating raw data when a secure reference is sufficient.

### 17.5 Permission semantics — Open

Questions requiring design:

- Should derived facts inherit the strictest source ACL?
- Can a team-visible fact cite evidence that only some users may inspect?
- How are users removed from a source reflected in cached context?
- Can organization admins override source permissions?
- How are external contractors isolated?

---

## 18. Evaluation strategy

### 18.1 Primary experiment

Compare the same Codex/GPT-5.6 configuration with and without ContextDB.

Controls:

- same repository commit;
- same task text;
- same environment and dependencies;
- same model and reasoning settings;
- clean sessions;
- identical time or tool limits;
- repeated trials if credits permit.

Avoid making Codex-versus-Claude the primary claim because model and harness
differences would confound the effect of the context system.

### 18.2 Benchmark task requirements

The task should:

- require changes across multiple files;
- contain a non-obvious behavioral constraint;
- have relevant information distributed across code and team history;
- include at least one previously rejected approach;
- be objectively testable;
- not have a solution patch stored in ContextDB;
- be difficult but solvable without ContextDB through exploration.

Example:

> Add concurrent webhook processing while preserving per-tenant ordering,
> idempotent retries, and legacy dead-letter behavior.

### 18.3 Efficiency metrics

- total input tokens;
- total output tokens;
- cached versus uncached tokens where available;
- estimated API cost;
- time to first relevant file;
- time to first edit;
- time to passing tests;
- total wall-clock time;
- number of searches;
- number of file reads;
- number of Git/GitHub history queries;
- total tool calls;
- repeated exploration actions.

### 18.4 Correctness metrics

- public tests passed;
- hidden tests passed;
- hidden behavioral assertions passed;
- historical constraints satisfied;
- regressions introduced;
- unnecessary files changed;
- security or policy violations;
- repetition of rejected approaches;
- human review findings.

### 18.5 Retrieval metrics

- context precision: relevant returned records / all returned records;
- context recall: required facts returned / all required facts;
- context utilization: returned records used or cited / all returned records;
- stale-record rate;
- unsupported-claim rate;
- permission-filter correctness;
- useful context tokens / total supplied context tokens;
- retrieval latency.

### 18.6 Avoiding a biased demonstration

- publish the benchmark repository or a reproducible fixture;
- ensure baseline Codex can access all original sources available in the repository;
- do not manually select records for the enhanced run;
- retrieve using only the task and repository state;
- keep hidden assertions out of ContextDB;
- publish run logs and evaluator code;
- distinguish prerecorded demonstration timing from measured benchmark timing;
- report unsuccessful runs, not only the best run, when possible.

---

## 19. Hackathon MVP

### 19.1 MVP goal

Demonstrate that automatic, indexed, shared repository context lets a clean Codex
session reuse difficult knowledge and complete one complex task more efficiently
and correctly.

### 19.2 Required MVP capabilities

- cloud-hosted organization and repository space;
- one authenticated demo user or simple test-account flow;
- ingestion of one repository;
- parsing of `AGENTS.md`/`CLAUDE.md` and selected documentation;
- ingestion of selected commits and pull-request fixtures or live GitHub data;
- ingestion of one Slack thread fixture;
- ingestion of one meeting transcript fixture;
- atomic context records with source citations;
- indexing by semantic similarity, source, type, time, path, and symbol where available;
- task-specific hybrid retrieval;
- token-budgeted response assembly;
- local MCP server with `get_task_context`, `inspect_context`, and
  `search_context`;
- one automatic or simulated lifecycle synchronization path;
- dashboard showing sources, records, lineage, and benchmark results;
- repeatable baseline versus ContextDB evaluation.

### 19.3 Explicit MVP exclusions

- complete production Slack OAuth and event ingestion if fixtures prove the concept;
- live meeting-bot integration;
- generalized multi-language code graph;
- enterprise-grade SCIM or SSO;
- billing;
- sophisticated graph database;
- fully autonomous trust resolution;
- cross-organization knowledge;
- support for every coding agent;
- production-scale data retention tooling.

### 19.4 Suggested implementation sequence

1. Freeze the benchmark task and required hidden context.
2. Define context-record and source schemas.
3. Build fixture ingestion for repository, PR, Slack, and transcript sources.
4. Implement hybrid retrieval and token-budget packing.
5. Implement the local MCP server.
6. Run an enhanced Codex task end to end.
7. Run and record the controlled baseline.
8. Add the UI around actual stored data and benchmark artifacts.
9. Add one automatic session-derived finding if time permits.
10. Polish installation, README, deployment, and video narrative.

---

## 20. Demo narrative

### 20.1 Three-minute outline

1. Explain that repositories store code but team understanding is fragmented.
2. Show a repository space connected to code, a PR, Slack, and a meeting.
3. Open one context lineage showing how a constraint developed and where it applies.
4. Present the complex coding task.
5. Show baseline Codex spending time rediscovering the subsystem or missing a constraint.
6. Start a clean Codex session with ContextDB enabled.
7. Show the MCP server automatically retrieving a compact, cited context packet.
8. Show Codex completing the task and passing hidden assertions.
9. Show tokens, tool calls, time, and correctness side by side.
10. Show a new finding from the completed session becoming available to the shared space.

### 20.2 Hero moment

The enhanced agent should avoid a reasonable but historically rejected approach
because ContextDB retrieved the relevant decision from a meeting, Slack thread,
PR, and code scope.

### 20.3 Desired audience takeaway

> The second agent did not receive the answer. It received the same accumulated
> understanding an experienced teammate would have brought to the task.

---

## 21. Product metrics after the hackathon

### 21.1 Adoption

- repositories connected;
- weekly active developers;
- active agent clients;
- tasks using retrieved context;
- percentage of sessions receiving useful context.

### 21.2 Compounding value

- unique context records reused across developers;
- agent discoveries reused by later sessions;
- average age of reused knowledge;
- repeated investigations avoided;
- contexts confirmed by successful tasks;
- context coverage by repository subsystem.

### 21.3 Quality and trust

- helpful/irrelevant feedback rate;
- stale retrieval rate;
- contradiction rate;
- human correction rate;
- evidence coverage;
- secret or policy incidents;
- permission-filter failures, with a target of zero.

### 21.4 Business value

- token and model-cost reduction;
- time to first productive change in unfamiliar repositories;
- onboarding time;
- task cycle time;
- escaped regressions attributable to missed context;
- developer satisfaction.

---

## 22. Risks and mitigations

### 22.1 “This is just RAG”

**Risk:** Users or judges see only document embeddings and MCP search.

**Mitigation:** Demonstrate source-aware structure, code scoping, temporal
validity, evidence lineage, automatic shared accumulation, and measurable task
improvement.

### 22.2 Poor context is worse than missing context

**Risk:** Incorrect or stale context causes agents to make confident mistakes.

**Mitigation:** Explicit trust states, immutable provenance, revision awareness,
contradiction display, conservative automatic admission, and easy human correction.

### 22.3 Automatic capture becomes surveillance

**Risk:** Developers reject pervasive session and communication collection.

**Mitigation:** Transparent collection settings, data minimization, no private
reasoning capture, source selection, session opt-out, retention controls, and
visible audit logs.

### 22.4 Permission leakage

**Risk:** Derived context exposes information from a restricted source.

**Mitigation:** ACL inheritance, retrieval-time authorization, deletion
propagation, tenant isolation tests, and safe restrictive defaults.

### 22.5 Index grows into another context dump

**Risk:** Shared memory grows faster than retrieval quality.

**Mitigation:** Atomic records, lifecycle management, deduplication, staleness
handling, budgeted retrieval, and usage/outcome feedback.

### 22.6 Integration complexity overwhelms the MVP

**Risk:** Time is spent on OAuth and connectors rather than proving value.

**Mitigation:** Use representative exported fixtures for Slack and meetings,
one repository, and one excellent benchmark.

### 22.7 Benchmark overfitting

**Risk:** The system appears to work only because the demo context was handcrafted.

**Mitigation:** Automate ingestion and retrieval, publish fixtures, avoid storing
the solution, use hidden tests, and repeat trials.

---

## 23. Open product and technical decisions

These are the areas that most need further elaboration in this conversation.

### 23.1 Product identity and unit of organization — High priority

- Is the primary unit a repository, a general “space,” or both?
- Can one feature space span multiple repositories?
- Who creates and administers a space?
- Is the initial buyer/user an individual developer, a team lead, or a platform team?
- What is the final product name and category language?

### 23.2 Automatic Codex integration — High priority

- Which exact Codex surface will the demo use: CLI, IDE, or app?
- Which lifecycle events can be captured safely and reliably?
- What data will be sent automatically at session start and completion?
- Does the integration use project hooks, a plugin, an MCP server plus instructions,
  or a wrapper?
- What happens when the agent never calls the context tool?
- How does a developer pause synchronization?

### 23.3 Context ontology — High priority

- Which record types are essential for the MVP?
- What is the minimum evidence needed for each type?
- Which records are normative versus descriptive?
- How are proposals, decisions, and superseded decisions differentiated?
- How should confidence be calculated and communicated?

### 23.4 Indexing and retrieval — High priority

- What exact hybrid retrieval algorithm will be implemented first?
- How are path and symbol scopes inferred from Slack and meetings?
- How are large `AGENTS.md` files converted into atomic indexed records without
  losing hierarchy?
- How is context packed under a token budget?
- What is the fallback when no high-confidence context is found?
- How will retrieval precision and recall be evaluated?

### 23.5 Benchmark task and dataset — Highest priority

- Which repository and language will be used?
- What complex task will be assigned?
- Which facts must the agent discover?
- Where will those facts be distributed?
- Which facts are historical constraints rather than solution hints?
- What public and hidden tests establish correctness?
- How many baseline and enhanced trials are affordable?

### 23.6 Technology choices — High priority

- TypeScript-only or Next.js plus Python workers?
- Which hosted PostgreSQL provider?
- Which embedding model?
- Which code parser and which language must it support?
- Which deployment platform supports the API and workers reliably?
- Will the hackathon use real GitHub ingestion or checked-in fixtures?

### 23.7 UI scope — Medium priority

- Which view is essential to understand the product in three minutes?
- Is the context lineage graph worth its implementation cost?
- Should the default experience emphasize search, live agent activity, or evaluation?
- How much context administration is necessary for the MVP?
- What visual language communicates trust, freshness, and source authority?

### 23.8 Trust and permissions — Medium priority for MVP, critical long term

- What automatically enters shared memory?
- What requires human confirmation?
- How are private-source permissions inherited?
- What secret-scanning and redaction behavior is required?
- How is malicious or erroneous context removed?

### 23.9 Commercial direction — Later

- Hosted SaaS, self-hosted, or hybrid?
- Pricing by developer, repository, indexed volume, retrieval, or model usage?
- Is accumulated context portable and exportable?
- What becomes the durable moat?

---

## 24. Recommended next discussion order

To turn this document into an executable plan, resolve questions in this order:

1. **Benchmark story:** choose the repository, task, hidden constraints, and success metrics.
2. **MVP interaction:** decide exactly how Codex obtains context and how a session updates the cloud.
3. **Minimal context model:** select the record types, evidence rules, and scope representation needed for that story.
4. **Retrieval:** define how records are indexed, ranked, and packed for the benchmark task.
5. **Stack:** select the fastest backend, database, MCP SDK, and deployment path.
6. **UI:** design only the screens necessary to make the benchmark and trust model visible.
7. **Additional sources and automation:** add live integrations only after the core loop works.

The benchmark story should come first because it determines which portions of
the larger architecture must actually exist for the hackathon.

---

## 25. Current one-paragraph description

ContextDB is shared, cloud-hosted context infrastructure for software teams and
their AI coding agents. It continuously indexes repository instructions, code
structure, Git history, pull requests, Slack discussions, meeting transcripts,
and useful findings from previous agent sessions. Rather than loading enormous
Markdown files or forcing every agent to rediscover the repository, ContextDB
retrieves a small, task-specific set of current, permission-aware, evidence-backed
context through MCP. As developers and agents work, the shared index improves,
allowing every future session to begin with the relevant understanding already
accumulated by the team.

## 26. Current one-sentence pitch

> ContextDB gives every coding agent the relevant accumulated understanding of
> the whole team, precisely indexed and automatically kept up to date.

