# Web UI Specification

## Status

Initial product and demo interface for discussion.

## Goal

Make shared agent experience understandable, trustworthy, and visually
impressive without becoming a generic database administration dashboard.

## Primary views

### Repository overview

Shows:

- recent agent sessions;
- experience created and reused;
- active tasks and worktrees;
- open questions and blockers;
- active service incidents;
- estimated time, tokens, and repeated investigation avoided.

### Experience explorer

Searches and filters experience by:

- type;
- task and keywords;
- service, error, or MCP tool;
- freshness and validation status;
- successful and failed reuse;
- ranking score.

Selecting an entry shows its summary, optional full detail, evidence, revisions,
feedback history, and related experiences.

### Agent sessions

Shows session ID, task, status, branch, worktree, retrieved experiences,
questions, contributions, and final outcome.

### Questions and collaboration

Displays unanswered questions, answers, related agents, blockers, and evidence.

### Incidents

Groups recent reports by platform and error signature. Displays first seen, last
seen, reporting agents, current status, and recovery observations.

### Evaluation

Compares baseline Codex with Codex using Agent Haderach:

- time;
- tokens;
- exploratory tool calls;
- correctness;
- repeated mistakes;
- experience reused.

## Demo visualizations

### Shared experience flow

Animate Agent A completing an investigation, creating experience, and Agent B
retrieving it later.

### Retrieval funnel

```text
All repository experience
→ metadata and keyword matches
→ freshness and outcome ranking
→ compact selected summaries
→ one expanded full entry
```

### Experience reinforcement

Show an existing workflow being reused successfully, gaining new evidence, and
increasing its score instead of creating a duplicate.

### Operational awareness

Show multiple agents reporting the same Jenkins failure and those reports
forming one active incident.

## Visual direction

- dark developer-tool interface;
- clear colors for experience types and statuses;
- monospace details for IDs, revisions, services, and tools;
- restrained glows and motion for live agent events;
- animated counters based on real event data;
- Framer Motion for transitions;
- React Flow only where relationships improve understanding.

Animations should explain real system behavior, not decorate static mock data.

## Realtime behavior

The UI should update when:

- a session starts or finishes;
- experience is created, reused, corrected, or invalidated;
- a question is asked or answered;
- an incident is reported or resolved;
- a task changes status.

Server-Sent Events are likely sufficient for the MVP.

## MVP screens

1. Repository overview.
2. Experience explorer and detail panel.
3. Live session/retrieval visualization.
4. Baseline comparison.

Questions and incident views may be panels within the overview rather than
separate routes initially.

## Open decisions

1. What is the single hero screen for the demo video?
2. Which events must be live versus replayed from recorded data?
3. Should task files be editable from the UI?
4. How should ranking factors be explained without overwhelming users?
