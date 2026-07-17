# Hackathon MVP and Demo

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
