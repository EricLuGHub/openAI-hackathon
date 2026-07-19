# MCP Server Specification

## Status

Initial agent-facing contract for discussion.

## Goal

Give coding agents a small, predictable interface for retrieving and sharing
repository experience without exposing database details or returning excessive text.

## Responsibilities

The MCP server:

- validates tool inputs and outputs;
- associates calls with the configured repository;
- manages session IDs;
- calls the cloud API;
- returns compact, token-budgeted results;
- reports reuse, outcomes, incidents, questions, and answers;
- never performs AI inference itself.

The connected agent decides pertinence, produces summaries and keywords, and
chooses whether new work deserves an experience entry.

## Proposed tools

### `start_session`

Registers a session and retrieves initial relevant context.

```yaml
task: Diagnose the checkout integration pipeline
session_id: optional-existing-id
revision: def456
branch: fix/checkout-pipeline
```

### `find_experience`

Searches prior workflows, lessons, pitfalls, summaries, handoffs, incidents,
questions, and answers.

```yaml
task: Diagnose the checkout integration pipeline
revision: def456
paths: [services/checkout/**]
services: [jenkins, redis]
error: Connection refused during checkout integration
keywords: [ci, integration-test, redis-sidecar]
types: [workflow, lesson, pitfall, incident]
token_budget: 800
```

Returns a few compact summaries with IDs, relevance, freshness, confidence,
outcomes, and ranking signals.

### `get_experience`

Retrieves one selected entry.

```yaml
experience_id: exp_123
detail: summary | full
```

### `save_experience`

Creates a new structured entry after the agent has searched for duplicates.

```yaml
session_id: session_456
experience: {}
```

The experience object follows `CLOUD_EXPERIENCE_STORE_SPEC.md`.

### `record_experience_feedback`

Reports whether retrieved experience was useful and valid.

```yaml
session_id: session_456
experience_id: exp_123
relevant: true
still_valid: true
outcome: successful
evidence: Jenkins build 1861
```

Mere retrieval does not increase an entry's score.

### `update_session`

Updates task state, current findings, blockers, or worktree information.

### `finish_session`

Records the final result and closes or hands off the session.

### `publish_question`

Creates a scoped question or blocker for other agents.

### `find_questions`

Returns unanswered questions relevant to the agent's current work.

### `answer_question`

Attaches an answer, evidence, or related experience to a question.

### `report_incident`

Reports a service failure or recovery observation.

## Duplicate handling

Before saving, the agent calls `find_experience` with the proposed entry's task,
summary, keywords, services, and error signatures.

- If an existing entry represents the same experience, report reuse and attach
  the new outcome or evidence.
- If the new information materially differs, create another record.
- The server may return duplicate candidates but does not use an AI model to
  decide semantic equivalence.

## Response size

- Search results return summaries only.
- `token_budget` limits the aggregate result.
- Full details require a separate call.
- Evidence is referenced rather than embedded when large.
- Pagination is used for administrative lists, not task context.

## Errors

The server should return structured errors for:

- invalid schema;
- unknown session;
- unavailable cloud service;
- missing static secret;
- record not found;
- invalid state transition;
- token budget too small;
- stale revision warning.

Failure to reach Agent Haderach must not prevent Codex from continuing normal
repository work.

## Transport and security

The static-secret MVP below is superseded for the hosted milestone by
`AUTHENTICATION_AND_MULTI_TENANCY_SPEC.md`, which defines personal MCP tokens,
scopes, teams, and repository authorization.

- Remote Streamable HTTP is the initial hosted transport.
- A local stdio bridge is optional.
- Local development may run without authentication.
- Public deployment uses one static secret from an environment variable.
- Secrets are never returned in MCP content.

## Open decisions

1. Which tools should be combined to keep the surface smaller?
2. Which session operations are mandatory at start and completion?
3. Should incident recovery use `report_incident` or a separate tool?
4. How should duplicate candidates be presented to the agent?
5. Which operations require user approval in Codex?
