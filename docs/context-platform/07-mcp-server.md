# MCP Server Design

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
