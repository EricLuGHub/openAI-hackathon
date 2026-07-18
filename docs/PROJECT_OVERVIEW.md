# Shared Experience for Coding Agents

## Vision

Coding agents working on the same repository should benefit from what previous
agents already investigated, learned, attempted, and successfully validated.

Today, each new session often starts from zero. Agents repeat searches,
rediscover known problems, retry failed approaches, and reconstruct workflows
that another contributor's agent already completed.

This project creates a shared, cloud-hosted experience layer that agents can
query before beginning an investigation.

> New agents should continue from previous agents' useful work instead of
> repeating it.

## What agents share

ME: Most importantly we don't want to lose relevant information that 

- **Workflows:** successful sequences of tools, MCP servers, commands, waits,
  tests, deployments, and verification steps.
- **Lessons:** reusable facts learned during an investigation.
- **Pitfalls:** confident assumptions or approaches that proved incorrect.
- **Summaries:** conclusions, supporting evidence, actions, and outcomes.
- **Handoffs:** unfinished work, blockers, and recommended next steps.

The system shares compact, useful experience—not entire conversation histories.

## How it works

```text
Agent receives a task
        ↓
Searches relevant past agent experience
        ↓
Reuses applicable findings and workflows
        ↓
Verifies that they remain valid
        ↓
Performs only the missing investigation
        ↓
Shares useful new experience with future agents
```

Past experience is guidance, not unquestioned truth. It should include its
repository revision, evidence, outcome, and validation status so a new agent can
decide what can be reused safely.

## Key use cases

### Reusing a previous diagnosis

A CI pipeline fails with an error. Before performing a full investigation, the
agent checks whether another agent encountered the same failure, what caused it,
how it was resolved, and whether that resolution still applies.

### Reusing a validation workflow

A developer asks how a change should be tested. The agent retrieves how similar
changes were successfully validated—for example, unit tests, integration tests,
a Jenkins deployment, smoke tests, and Dynatrace log or metric checks.

### Avoiding a known pitfall

A previous agent followed a plausible approach that failed after deeper
investigation or human correction. A future agent sees that experience before
repeating the mistake.

### Continuing unfinished work

One contributor's agent stops after identifying a likely cause or blocker. A
second contributor's agent retrieves the handoff and continues from that point.

## Product shape

- A cloud service stores and retrieves repository-scoped agent experience.
- An MCP server connects Codex and other compatible agents to that service.
- A context manager selects the most relevant prior experience for the current task.
- A UI makes shared workflows, findings, evidence, outcomes, and reuse visible.

## Hackathon goal

Demonstrate two clean agent sessions working on the same repository:

1. The first agent performs an expensive investigation and records useful experience.
2. The second agent receives a similar problem, retrieves that experience,
   validates it, and reaches the correct result with less repeated work.

Success should be measured through time, tokens, exploratory tool calls,
correctness, and whether the second agent avoids a previously discovered pitfall.

## Current positioning

> A shared experience layer for coding agents that preserves successful
> workflows, learned facts, failed assumptions, conclusions, and handoffs—so
> every agent can build on what previous agents already discovered.

