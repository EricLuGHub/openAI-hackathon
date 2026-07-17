# Sources and Context Model

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
