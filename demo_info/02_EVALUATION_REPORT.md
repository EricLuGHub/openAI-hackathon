# Codex With and Without Agent Haderach

## Executive result

Agent Haderach completed a genuine two-agent experience transfer on an untouched
open-source revision. The agent using Haderach produced the same correct runtime
implementation, added one additional regression case, and recorded **45.6%
fewer non-cached input tokens**.

This is an encouraging proof of concept from one pair of runs. It is not a
statistically significant benchmark or a general performance guarantee.

## Fixed scenario

| Field | Value |
|---|---|
| Repository | `sindresorhus/p-limit` |
| Starting revision | `42599ebbbb1228a5bdab381fcf8f4ac20eb8d551` |
| Task | Add `limit.onIdle(): Promise<void>` |
| Required behavior | Immediate idle resolution, multiple waiters, active + pending drain, safe `clearQueue()` behavior |
| Required surfaces | Runtime, TypeScript declaration, type test, README, runtime tests |
| Agent | Codex CLI 0.144.1, same documented default model and execution permissions |
| Experience backend | Local Agent Haderach MCP over Streamable HTTP |

The task was created specifically for this evaluation. Both worktrees began at
the same upstream commit. The second agent received neither the first agent's
patch nor its conversation.

## Conditions

### Agent A: discovery without retrieval

Agent A was told not to retrieve prior experience. It:

1. explored the repository;
2. implemented the feature;
3. ran the complete test suite;
4. saved three independent records through MCP:
   - an implementation and validation workflow;
   - a lesson defining idle as `activeCount === 0 && queue.size === 0`;
   - a pitfall explaining that clearing pending work must not signal idle while
     active work remains.

### Agent B: reuse with Haderach

Agent B started in a separate clean worktree. It:

1. queried Haderach before broad exploration;
2. received three relevant compact cards, approximately 168 summary tokens;
3. expanded their details;
4. verified the claims against the same repository revision;
5. implemented independently;
6. submitted evidence-backed successful-use feedback.

This comparison is accurately described as **discovery without retrieval versus
reuse with retrieval**. It was not blinded.

## Measured comparison

| Metric | Without retrieval | With Haderach | Recorded difference |
|---|---:|---:|---:|
| Outcome | Pass | Pass | No correctness regression |
| AVA tests after change | 25 | 26 | Haderach added one test |
| Total input tokens | 511,233 | 408,710 | **20.1% lower** |
| Cached input tokens | 455,424 | 378,368 | Not claimed |
| Non-cached input tokens | 55,809 | 30,342 | **45.6% lower** |
| Output tokens | 4,981 | 4,966 | 0.3% lower |
| Wall time | 198.4 s | 143.5 s | 27.6% lower, confounded |

The runtime `index.js` diff was identical in both implementations. The Haderach
agent additionally tested the `rejectOnClear: true` form of the known
`clearQueue()` edge case.

The Haderach worktree passes:

- 26 AVA tests;
- `tsd` type tests;
- lint, with one unrelated pre-existing TODO warning.

## Feedback and reinforcement

All three reused records changed after evidenced successful reuse:

```text
successful_uses: 0 → 1
failed_uses:     0 → 0
usefulness:      0.50 → 1.00
ranking_score:   0.8000 → 0.8583
```

An unrelated seeded Jenkins/Redis record appeared below the three relevant
results. This demonstrates ranking but also exposes the need for stronger
repository isolation in a multi-repository implementation.

## What the evaluation validates

- A real Codex process can connect to Haderach through MCP.
- One agent can generate useful structured experience from genuine work.
- A clean second agent can retrieve that experience without seeing the first patch.
- Retrieval can begin with small cards and defer full detail.
- The second agent can independently produce the same runtime implementation.
- Reused experience can improve validation coverage rather than merely encourage copying.
- Successful reuse can reinforce future ranking.
- One observed pair showed a substantial reduction in non-cached input tokens.

## Limitations

1. **One run per condition.** No statistical inference is possible.
2. **Dependency timing confound.** Agent A ran `npm install` inside its timed
   session; Agent B began with dependencies installed. Wall time is recorded but
   is not attributed causally to Haderach.
3. **Different workflow instructions.** Agent B was told to retrieve before
   broad exploration; Agent A was told not to retrieve.
4. **Knowledge producer versus consumer.** Agent A necessarily paid the cost of
   discovering the experience that Agent B reused.
5. **Small task.** The task was real but contained within one package.
6. **Limited source types.** Slack, meetings, large instruction files, stale
   knowledge, and contradictory records were not tested.
7. **Repository-isolation noise.** An unrelated seeded record appeared below the
   relevant results.
8. **Raw telemetry retention.** Token and timing measurements are recorded in
   the source evaluation report, but raw Codex JSON usage/session logs were not
   retained with the inspected artifact directory and cannot currently be
   independently recomputed.

## Stronger next benchmark

| Condition | Purpose |
|---|---|
| Baseline | Fresh Codex with normal repository tools and no Haderach |
| Haderach | Identical fresh Codex with Haderach retrieval |
| Markdown control | Same facts supplied through conventional Markdown |
| Full-context control | All source material supplied without ranked selection |

The Markdown control is essential. It determines whether the benefit comes from
Haderach's shared indexing and progressive retrieval or simply from providing
the agent with additional knowledge.

Recommended improvements:

- at least three runs per condition for an initial replication;
- ideally multiple tasks and repositories;
- preinstalled dependencies in every worktree;
- randomized condition order;
- identical prompts except Haderach availability;
- hidden behavioral assertions written before execution;
- exact MCP context-token accounting;
- retained raw JSON session logs;
- blinded patch evaluation;
- deliberate stale and misleading-memory tests.

## Reproduction references

- [Original evaluation results](../docs/EVALUATION_RESULTS.md)
- [Evaluation specification](../docs/EVALUATION_SPEC.md)
- Local experiment artifacts, when present on the development machine:
  `/Users/ericlu/Works/sandbox-oai/agent-haderach-evaluation`

## Safe headline for judges

> In one real-repository transfer, Haderach preserved correctness, added an
> edge-case test, and recorded 45.6% fewer non-cached input tokens.

Do not shorten this to a general claim that Haderach always reduces tokens by
45.6%.

