# Evaluation Specification

## Status

Initial validation plan for discussion.

## Goal

Prove that shared agent experience reduces repeated work without lowering
correctness or causing stale information to mislead agents.

## Primary comparison

Use the same Codex configuration in both conditions:

| Condition      | Shared experience |
| -------------- | ----------------- |
| Baseline       | Disabled          |
| Agent Haderach | Enabled           |

Keep the model, prompt, repository revision, environment, tools, and time limits
the same.

## Primary demo

1. Agent A investigates an expensive pipeline failure.
2. It records the diagnosis, successful resolution, validation workflow, and a
   disproven assumption.
3. A clean Agent B receives the same or closely related failure.
4. Agent B retrieves the previous experience.
5. It verifies that the experience still applies and attempts the known resolution.
6. The evaluation compares Agent B with a baseline clean session.

## Secondary demo

A developer asks how to validate a change. Agent Haderach retrieves a proven
workflow involving tests, deployment, smoke checks, and observability tools.

## Metrics

### Efficiency

- wall-clock time;
- input and output tokens;
- searches and file reads;
- total tool calls;
- time before first useful action;
- repeated investigation steps.

### Correctness

- tests passed;
- pipeline outcome;
- expected service or metric state;
- regressions;
- previously disproven approaches repeated;
- human acceptance where deterministic checks are unavailable.

### Experience quality

- retrieved entries used;
- useful versus irrelevant results;
- stale or incorrect results;
- successful reuse;
- token size of returned context;
- duplicate entries avoided.

## Controls

- fresh sessions;
- clean repository state;
- identical task wording;
- fixed repository revision;
- same MCP tools except Agent Haderach;
- no hidden solution in the stored experience;
- deterministic tests where possible;
- full logs retained for both conditions.

## Success criteria

Agent Haderach should:

- preserve or improve correctness;
- prevent at least one meaningful repeated mistake or investigation; and
- materially reduce time, tokens, or exploratory tool calls.

Suggested initial threshold: at least 25% improvement in one efficiency metric
without a correctness regression.

## Failure criteria

The concept should be reconsidered if:

- the baseline finds the same answer almost immediately;
- stored experience merely reveals the solution;
- retrieved context regularly creates confusion;
- stale records cause incorrect work;
- the experience system costs more tokens than it saves;
- improvements disappear outside one scripted example.

## Open decisions

1. Which repository and pipeline scenario will be used?
2. How many clean runs per condition are affordable?
3. Which metrics can Codex expose reliably?
4. Which assertions are automated versus manually reviewed?
5. How will stale-experience behavior be tested?
