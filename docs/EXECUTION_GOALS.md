# Agent Haderach Execution Goals

## Purpose

This document defines the concrete implementation milestone to pursue after the
initial specifications are sufficiently resolved. It is the working definition
of “done” for the first end-to-end version of Agent Haderach.

## Target milestone

Build a runnable single-team, single-repository vertical slice where two Codex
sessions can share and reuse structured agent experience through MCP.

The milestone is complete only when the full workflow functions:

```text
Agent A starts a session
→ searches existing experience
→ completes an investigation
→ saves a workflow, lesson, pitfall, or summary
→ Agent B starts a clean session
→ retrieves Agent A's experience
→ expands one useful entry
→ reports whether reuse succeeded
→ the cloud store updates its feedback and ranking
→ the web UI displays the complete lifecycle
```

## Goal 1: Finish implementation-blocking decisions

Resolve only specification questions required for the vertical slice:

- database and deployment choice;
- initial ranking formula;
- usefulness and confidence calculation;
- freshness behavior;
- automatic versus explicit feedback;
- final MVP MCP tool list;
- local task-state behavior;
- required demo and evaluation scenario.

Questions that do not block the vertical slice may remain open.

## Goal 2: Establish the TypeScript monorepo

Create a runnable workspace containing:

```text
apps/
├── cloud/
│   └── src/
│       ├── api/
│       ├── mcp/
│       ├── database/
│       └── services/
└── web/

packages/
└── contracts/

workspace/
```

Required foundations:

- pnpm workspace configuration;
- shared TypeScript configuration;
- formatting and linting;
- environment-variable examples;
- test command;
- development commands documented in the root README.

## Goal 3: Implement the cloud experience store

Implement PostgreSQL storage for:

- sessions;
- experience entries;
- experience feedback;
- questions and answers;
- incidents;
- task state where required.

Required behavior:

- create and retrieve experience;
- compact summary and optional full detail;
- metadata, keyword, and full-text search;
- deterministic ranking;
- token-budgeted results;
- duplicate-reuse reinforcement;
- revision, revised date, validation date, and ranking score;
- freshness and status updates.

Provide migrations and representative seed data.

## Goal 4: Implement the MCP server

Expose the minimum useful operations:

```text
start_session
find_experience
get_experience
save_experience
record_experience_feedback
update_session
finish_session
publish_question
find_questions
answer_question
report_incident
```

Requirements:

- validated schemas;
- compact structured responses;
- token-budget enforcement;
- graceful cloud-service failure;
- remote MCP transport;
- one static API secret when publicly deployed;
- no backend AI model or OpenAI API dependency.

The tool list may be reduced if combining operations creates a clearer agent
experience.

## Goal 5: Create the repository workspace runtime

Provide a usable `.agent-haderach/` template containing:

- agent instructions;
- configuration;
- task directories and templates;
- session-state convention;
- experience contribution rules;
- question and incident behavior;
- worktree guidance;
- a documented grooming routine.

The 60-minute grooming loop may be implemented as a simple supervisor or
automation. If automatic scheduling is not reliable in the MVP, provide a
repeatable manual command and document the limitation.

## Goal 6: Build the web experience

Implement the minimum screens needed to understand and demonstrate the product:

1. Repository overview.
2. Experience search and detail view.
3. Agent session activity.
4. Questions and incidents.
5. Evaluation comparison.

The interface should visibly demonstrate:

- experience moving from Agent A to Agent B;
- summary-to-full-detail progressive retrieval;
- successful reuse increasing feedback and ranking;
- an active incident or unanswered question;
- measured difference between baseline and enhanced runs.

Animations must represent real or recorded system events rather than arbitrary
decorative motion.

## Goal 7: Build the evaluation scenario

Select a suitable real open-source repository and design a realistic feature or
investigation task that does not already have a published solution. The task
should require enough repository exploration to make prior experience valuable,
while remaining objectively testable.

Run the scenario in two stages:

1. A first clean agent performs the task without Agent Haderach. Persist its
   useful workflows, lessons, pitfalls, summary, evidence, and outcome in the
   cloud experience store.
2. Reset the repository and start a new clean agent on the same task. This agent
   uses the MCP server to retrieve the first agent's experience, expands relevant
   entries, verifies them against the repository, and attempts the task with less
   rediscovery.

The comparison should confirm whether persisted agent experience genuinely
makes the second run easier rather than merely demonstrating that records can be
stored and retrieved.

Required experiment:

- one clean baseline Codex run without Agent Haderach;
- one clean run with Agent Haderach;
- a documented open-source repository and fixed starting revision;
- a feature or investigation task created specifically for the evaluation;
- persisted experience produced from the first run rather than handcrafted
  after observing what the second agent needs;
- identical task, repository revision, model configuration, and tools;
- objective outcome checks;
- recorded time, tokens where available, and exploratory tool calls;
- evidence that the enhanced agent reused prior experience;
- no solution patch hidden in the experience record.

Target result:

- no correctness regression; and
- at least 25% improvement in one meaningful efficiency metric; or
- prevention of one meaningful repeated mistake.

## Goal 8: Make the project judge-ready

The repository must include:

- concise project description;
- architecture overview;
- installation and local-development instructions;
- database setup and migrations;
- MCP configuration example;
- seeded demo path;
- evaluation instructions and results;
- explanation of how Codex and GPT-5.6 were used to build the project;
- limitations and future work;
- license.

The public demo should be testable without reconstructing the system from
scratch.

## Verification requirements

Before declaring the milestone complete:

- install dependencies from a clean checkout;
- run database migrations;
- seed demo data;
- start the server and web application;
- connect an MCP client;
- complete the Agent A to Agent B workflow;
- reproduce the open-source evaluation from the documented starting revision;
- confirm that Agent B retrieves and uses experience created by Agent A;
- verify feedback changes ranking signals;
- run automated tests;
- run formatting, linting, and type checking;
- verify the primary UI flows;
- document any incomplete or simulated behavior honestly.

## Explicit non-goals

Do not block the first milestone on:

- multiple organizations, teams, or repositories;
- signup, OAuth, roles, or granular permissions;
- dedicated vector-search infrastructure;
- backend AI inference;
- raw conversation storage;
- production Slack, Zoom, Jenkins, or Dynatrace integrations;
- automatic semantic deduplication;
- cross-repository agent routing;
- production billing or enterprise deployment;
- a complete autonomous ticketing platform.

## Stop conditions

Work on this milestone should stop and report clearly when:

1. All verification requirements pass; or
2. A blocker requires user authority, credentials, payment, or a product choice
   that would materially change the design; or
3. The evaluation demonstrates that shared experience does not improve the
   chosen task enough to justify the system.

Minor polish opportunities are not reasons to continue indefinitely after the
vertical slice and verification requirements are complete.
