# Users and Workflows

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
