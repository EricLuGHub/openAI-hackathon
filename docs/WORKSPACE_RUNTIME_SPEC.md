# Agent Workspace Runtime Specification

## Status

Initial design for discussion. This component defines the shared local workspace
that coordinates repositories, worktrees, Codex sessions, and Agent Haderach.

## Goal

Provide every contributor's agent with the same operating conventions for:

- starting and identifying sessions;
- retrieving shared experience;
- managing tasks and worktrees;
- communicating with other agents;
- recording useful outcomes;
- grooming the shared experience store.

The workspace runtime is primarily instructions, templates, configuration, and
small automations. The cloud service remains the shared source of agent
experience.

## Proposed workspace layout — Decided

```text
agent-haderach-workspace/
├── AGENTS.md
├── config.yaml
├── repos/
│   └── checkout/
│       ├── main/
│       └── worktrees/
│           ├── task_123/
│           └── task_456/
├── tasks/
│   ├── backlog/
│   ├── in-progress/
│   ├── blocked/
│   ├── done/
│   └── archived/
├── sessions/
├── workflows/
├── templates/
│   ├── task.md
│   └── handoff.md
└── hooks/
```

`AGENTS.md` explains the required workflow. `config.yaml` contains repository
and service settings. `repos/<repo>/main` is the canonical checkout, and
task-specific worktrees live under `repos/<repo>/worktrees/`. Task files provide
lightweight local visibility while the cloud store preserves shared experience
across contributors.

The MVP configures one repository but keeps the `repos/` boundary so additional
repositories can be added later without restructuring the workspace.

## Session lifecycle

### Start

When beginning meaningful work, the agent should:

1. Generate a unique session ID.
2. Persist the ID locally and register it with Agent Haderach.
3. Identify the current repository, revision, branch, and task.
4. Search for relevant workflows, lessons, pitfalls, summaries, incidents,
   questions, and handoffs.
5. Check whether another agent is already performing overlapping work.
6. Create or claim a task ticket when appropriate.

The same session ID is used for later updates, questions, feedback, and the
final outcome.

### During work

The agent should:

- keep the task status current;
- report meaningful blockers;
- publish questions when missing context prevents progress;
- check for answers or relevant incidents;
- record which retrieved experiences were used;
- avoid creating duplicate experience entries;
- create a worktree when the task should be isolated from the current checkout.

### Completion

Before ending a completed session, the agent should:

1. Run appropriate verification.
2. Update the task outcome.
3. Report whether retrieved experience was useful and still valid.
4. Propose any reusable workflows, lessons, pitfalls, summaries, or answers.
5. Record supporting evidence and the current Git revision.
6. Move the task to `done`.

### Incomplete exit

If work remains unfinished, the agent should create a handoff containing:

- current understanding;
- actions already attempted;
- evidence collected;
- blockers and unanswered questions;
- changed files or worktree location;
- recommended next step.

The task moves to `blocked` or remains `in-progress` as appropriate.

## Task tickets

Each task is represented by one Markdown file:

```yaml
---
id: task_123
title: Diagnose checkout integration failure
status: in-progress
session_id: session_456
worktree: ../worktrees/task_123
created_at: 2026-07-19T10:00:00Z
updated_at: 2026-07-19T10:30:00Z
blocked_by: []
---
ME: also we should have a description provided by the human stored somewhere in the tickets

## Goal

## Current state

## Evidence

## Next step
```

Moving the file between task directories changes its status. The frontmatter
remains authoritative enough for tooling to detect accidental inconsistencies.

Initial statuses:

```text
backlog
in-progress
blocked
done
archived
```

Deletion should normally mean archiving with a reason rather than silently
removing task history.

## Worktrees

The agent should create a Git worktree when:

- another task is already modifying the local checkout;
- work may run in parallel;
- the task is long-running;
- isolation makes review or rollback safer.

The task ticket records the worktree path and branch. Completing or abandoning
a task should trigger cleanup instructions, but worktrees must not be deleted
while they contain uncommitted work.

## MCP interaction expectations

The runtime instructions will eventually reference MCP operations such as:

```text
start_session
find_experience
record_experience_feedback
save_experience
update_session
publish_question
find_questions
answer_question
report_incident
finish_session
```

Exact tool schemas belong in `MCP_SERVER_SPEC.md`. This document defines when
agents are expected to use them.

## Experience contribution rules

An agent should save information that can:

- prevent meaningful repeated investigation;
- reproduce a successful workflow;
- prevent a known mistake;
- explain an important conclusion;
- help continue unfinished work;
- answer another agent's question;
- warn other agents about a current incident.

Routine actions, obvious code facts, unsupported guesses, and duplicate findings
should not become new entries.

If an existing entry expresses the same experience, the agent should report its
reuse and outcome rather than create a duplicate.

## Correcting shared experience

If evidence proves an entry false, incomplete, or outdated, the agent may:

- propose a correction;
- add new evidence;
- mark it contradicted or stale;
- supersede it with a newer entry;
- request deletion when the entry is unsafe or has no historical value.

Ordinary corrections should preserve history. Permanent deletion is reserved
for sensitive, malicious, or clearly invalid data.

## Grooming loop

The workspace should periodically perform maintenance such as:

- checking unanswered questions;
- reviewing active incidents;
- identifying stale or contradicted experience;
- reconciling duplicates;
- checking abandoned or blocked tasks;
- updating session and task state;
- confirming whether previously reported outages recovered.

The initial target is every 60 minutes while the workspace is active.

`AGENTS.md` can describe this requirement but cannot enforce a timer. Execution
requires a Codex automation, lifecycle hook, or small supervisor process. The
mechanism remains an open implementation decision.

## Configuration

Initial `config.yaml` concept:

```yaml
repository: acme/checkout
repository_path: repos/checkout/main
api_url: https://agent-haderach.example.com
grooming_interval_minutes: 60
tasks_directory: tasks
worktrees_directory: repos/checkout/worktrees
```

Secrets must come from environment variables rather than this file.

## Open decisions

1. Which runtime mechanism enforces the 60-minute grooming loop?
2. Should task files be committed to Git or remain local runtime state?
3. Which tasks require worktrees automatically?
4. How should overlapping work be detected and resolved?
5. Which MCP calls are mandatory versus recommended at session boundaries?
6. How much session state belongs locally versus only in the cloud?
