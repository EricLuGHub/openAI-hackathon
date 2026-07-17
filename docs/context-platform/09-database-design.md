# Database Design

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
