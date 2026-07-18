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

The goal is to preserve useful information that would otherwise disappear when
an agent session ends, while keeping each record scoped to the repository,
system, task, or tool for which it is relevant.

- **Workflows:** successful sequences of tools, MCP servers, commands, waits,
  tests, deployments, and verification steps.
- **Lessons:** reusable facts learned during an investigation.
- **Pitfalls:** confident assumptions or approaches that proved incorrect.
- **Summaries:** conclusions, supporting evidence, actions, and outcomes.
- **Handoffs:** unfinished work, blockers, and recommended next steps.

The system shares compact, useful experience—not entire conversation histories.

## Learning what works

Agents can report whether retrieved experience was relevant, current, and
successful. Objective outcomes—such as tests passing, a pipeline recovering, or
expected metrics remaining healthy—carry more weight than a subjective rating.

Experience that repeatedly helps agents is ranked more highly. Experience that
fails, becomes stale, or is contradicted is downgraded. Over time, the system
learns which workflows and lessons actually work for the team.

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

### Sharing operational awareness

If an agent cannot access Jenkins, Dynatrace, or another platform, it can check
whether other agents recently reported the same failure. This prevents many
agents from independently debugging their credentials when the platform itself
is unavailable. Recent reports can be grouped into a temporary incident and
expired when agents observe recovery.

### Asking other agents — Future direction

An agent may leave a question, blocker, or request for evidence. Another agent
working with relevant context could answer it or attach a useful finding. This
would allow agents to collaborate asynchronously across contributors, but it is
not required for the initial product.

## Why not store everything in Markdown?

Markdown remains appropriate for stable, curated specifications and repository
instructions. It is less suitable for high-volume experience created during
everyday investigations:

- developers cannot be expected to open a pull request for every useful finding;
- thousands of granular entries would create noisy files and search results;
- Git would accumulate documentation churn and merge conflicts;
- rapidly changing incidents and uncertain findings do not belong beside
  authoritative specifications;
- Markdown cannot naturally track successful reuse, failed reuse, freshness, or
  outcome-based confidence.

The cloud service provides a low-friction write path through MCP. Agents can
contribute structured experience when it is useful without turning every
investigation into a documentation pull request.

## Why not use `rg`?

`rg` is excellent for finding exact text in known local files. It quickly
returns textual matches, but it does not rank past experience by task relevance,
repository scope, freshness, successful outcomes, or usefulness to previous
agents.

Agent Haderach complements local search. The agent uses `rg` to understand the
current code and queries shared experience to discover what other agents tried,
learned, validated, or found broken.

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

The system is intentionally scoped: it shares reusable wisdom among agents
without replacing source code, authoritative documentation, or normal agent
investigation.
