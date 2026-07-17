# Retrieval and Context Assembly

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
