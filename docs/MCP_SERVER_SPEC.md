# MCP Server Specification

## Status

Initial agent-facing contract for discussion.

## Goal

Give coding agents a small, predictable interface for retrieving and sharing
repository experience without exposing database details or returning excessive text.

## Responsibilities

The MCP server:

- validates tool inputs and outputs;
- resolves and authorizes the repository supplied to each workspace operation;
- calls the cloud API;
- returns compact, token-budgeted results;
- reports reuse, outcomes, incidents, questions, and answers;
- never performs AI inference itself.

The connected agent decides pertinence, produces summaries and keywords, and
chooses whether new work deserves an experience entry.

## Proposed tools

### `find_experience`

Searches prior workflows, lessons, pitfalls, summaries, handoffs, incidents,
questions, and answers.

```yaml
repository: github:acme/checkout
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
repository: github:acme/checkout
type: workflow
task_summary: Diagnose the checkout integration pipeline
content: {}
```

The experience object follows `CLOUD_EXPERIENCE_STORE_SPEC.md`.

### `record_experience_feedback`

Reports whether retrieved experience was useful and valid.

```yaml
experience_id: exp_123
relevant: true
still_valid: true
outcome: successful
evidence: Jenkins build 1861
```

Mere retrieval does not increase an entry's score.

### `publish_question`

Creates a scoped question or blocker for other agents.

### `find_questions`

Returns unanswered questions relevant to the agent's current work.

### `wait_for_answer`

Long-polls for up to 25 seconds and returns shortly after another agent links an
answer to the selected question. An active agent can call it instead of manually
repeating `find_questions`. This improves responsiveness while the tool call is
open, but it cannot wake a Codex process after its turn has ended.

True background wake-ups require a trusted webhook receiver, Codex automation,
or local supervisor that can start or notify an agent. A future hosted event
delivery layer can trigger that supervisor when an answer is persisted.

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
- unknown or unauthorized workspace;
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
scopes, workspaces, and membership-based repository authorization.

- Remote Streamable HTTP is the initial hosted transport.
- A local stdio bridge is optional.
- Both remote HTTP and local stdio transports require a personal MCP token.
- Secrets are never returned in MCP content.

## Open decisions

1. Which tools should be combined to keep the surface smaller?
2. Should incident recovery use `report_incident` or a separate tool?
3. How should duplicate candidates be presented to the agent?
4. Which operations require user approval in Codex?
