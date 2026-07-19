# Real-repository evaluation

## Result

Agent Haderach completed a genuine two-agent transfer on an untouched open-source revision. Agent B used Agent A's structured experience, produced the same runtime implementation, added one additional regression case, and consumed **45.6% fewer non-cached input tokens**. The three reused entries were then reinforced from `0.8000` to `0.8583` ranking score.

This is an initial proof, not a statistically significant benchmark.

## Fixed scenario

| Field              | Value                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Repository         | `sindresorhus/p-limit`                                                                            |
| Starting revision  | `42599ebbbb1228a5bdab381fcf8f4ac20eb8d551`                                                        |
| Task               | Add `limit.onIdle(): Promise<void>`                                                               |
| Required behavior  | Immediate idle resolution, multiple waiters, active + pending drain, safe `clearQueue()` behavior |
| Required surfaces  | Runtime, TypeScript declaration, type test, README, runtime tests                                 |
| Agent              | Codex CLI 0.144.1, same default model and execution permissions                                   |
| Experience backend | Local Agent Haderach MCP over Streamable HTTP                                                     |

The task was invented for this evaluation. Both worktrees began at the same upstream commit. Agent B did not receive Agent A's patch or conversation.

## Method

Agent A was told not to retrieve prior experience. It explored the repository, implemented the feature, ran the full suite, and saved three independent records through MCP:

1. A workflow covering transition points and public API surfaces.
2. A lesson defining idle as `activeCount === 0 && queue.size === 0`.
3. A pitfall warning that clearing pending work must not signal idle while work remains active.

Agent B started in a separate clean worktree. Before broad exploration it queried with the task and relevant terms. The initial search response returned compact cards; the three relevant records used approximately 168 tokens of summary content. Agent B then requested full detail, verified the claims against the same revision, implemented independently, and submitted successful feedback with test evidence.

## Observations

| Metric                        | Agent A: discovery | Agent B: reuse |               Difference |
| ----------------------------- | -----------------: | -------------: | -----------------------: |
| Outcome                       |               Pass |           Pass |            No regression |
| AVA tests after change        |                 25 |             26 |         B added one case |
| Total input tokens            |            511,233 |        408,710 |              20.1% lower |
| Cached input tokens           |            455,424 |        378,368 |                        — |
| Non-cached input tokens       |             55,809 |         30,342 |          **45.6% lower** |
| Output tokens                 |              4,981 |          4,966 |               0.3% lower |
| Wall time, session timestamps |            198.4 s |        143.5 s | 27.6% lower, confounded* |

\* Agent A discovered missing dependencies and ran `npm install` inside its timed session; Agent B's dependencies were preinstalled. Wall time is therefore recorded but is not claimed as a causal improvement.

Both implementations produced an identical `index.js` runtime diff. Agent B added explicit coverage for the `rejectOnClear: true` form of the known clear-queue pitfall, so reuse improved validation rather than copying a hidden solution.

## Feedback lifecycle evidence

Each of the three selected entries changed after evidenced reuse:

```text
successful_uses: 0 → 1
failed_uses:     0 → 0
usefulness:      0.50 → 1.00
ranking_score:   0.8000 → 0.8583
```

The unrelated seeded Jenkins/Redis record appeared below the three matching entries. This demonstrates ranking, though repository isolation should remove that noise in a multi-repository version.

## Reproduce

1. Start PostgreSQL, migrate, and run the server as described in the root README.
2. Clone `https://github.com/sindresorhus/p-limit` and check out the fixed revision.
3. Create two worktrees from that revision and install dependencies in both before timing.
4. Run Agent A with the task, MCP enabled only for session creation and saving, and no retrieval.
5. Run Agent B from the second worktree with the same task and require retrieval before exploration.
6. Compare `npm test`, Codex JSON usage events, command count, runtime diffs, and experience feedback.

The local artifacts for this run are under `/Users/ericlu/Works/sandbox-oai/agent-haderach-evaluation` on the development machine.

## What this validates

- Remote MCP connectivity from a real Codex process.
- Compact search followed by optional detail retrieval.
- Useful experience generated by an agent rather than handcrafted seed data.
- Independent reuse on a pristine copy of a real repository.
- Feedback-driven reinforcement only after successful application.
- A measurable efficiency gain without a correctness regression.

## Limitations

This is one task and two runs. Prompt sensitivity, cache behavior, and normal model variance can affect token counts. A stronger benchmark should preinstall dependencies, repeat multiple tasks and seeds, compare against a Markdown-only baseline, capture exact per-tool context size, and blind the evaluator to the expected implementation.
