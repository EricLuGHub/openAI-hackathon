# Three-Minute Demo Runbook

## Demo objective

Show one idea clearly:

> The useful experience discovered by one coding agent can help another clean
> agent complete related work without receiving the first agent's patch or chat.

The video should show a working product, real MCP activity, and measured results.

## Recommended timeline

### 0:00–0:20 — Problem

Visual:

- two developers or Codex sessions working on the same repository;
- the second session beginning from a blank state.

Narration:

> Coding agents can read code, but every clean session forgets what previous
> agents investigated, learned, and proved. Teams share code through Git, while
> their agents repeatedly pay the cost of rediscovery.

### 0:20–0:40 — Product

Show the dashboard and MCP connection.

Narration:

> Agent Haderach is a shared experience layer accessed through MCP. Agents save
> compact workflows, lessons, and pitfalls with evidence and repository scope.
> A future agent retrieves only the highest-signal summaries and verifies them
> against the current revision.

### 0:40–1:15 — Agent A creates experience

Use the recorded `p-limit` task:

> Add `limit.onIdle(): Promise<void>` with correct behavior for multiple waiters,
> queue draining, and `clearQueue()`.

Show:

1. Agent A completing the investigation.
2. Three records appearing through real MCP activity:
   - workflow;
   - definition-of-idle lesson;
   - clear-queue pitfall.
3. Evidence and revision metadata in the dashboard.

Avoid replaying a long coding session. Compress it to the moments that prove
experience creation.

### 1:15–1:55 — Agent B reuses it

Show a visibly separate clean worktree/session.

Show:

1. Agent B calling Haderach before broad exploration.
2. Three compact result cards returned within the token budget.
3. Agent B expanding the pitfall record.
4. Agent B checking the current repository before applying it.
5. Tests passing, including the additional `rejectOnClear: true` regression case.

Narration:

> Agent B received no patch and no conversation from Agent A. It received about
> 168 tokens of compact summaries, expanded the useful details, verified them,
> and implemented independently.

### 1:55–2:25 — Reinforcement

Show the dashboard changing after feedback:

```text
successful uses  0 → 1
usefulness        0.50 → 1.00
ranking score     0.8000 → 0.8583
```

Narration:

> Haderach does not treat stored experience as permanent truth. Agents report
> evidenced outcomes. Successful knowledge rises; stale or failed advice can be
> demoted.

### 2:25–2:50 — Results

Animate the comparison table:

| Metric                  | Discovery | Haderach reuse |
| ----------------------- | --------: | -------------: |
| Correct result          |      Pass |           Pass |
| AVA tests               |        25 |             26 |
| Total input tokens      |   511,233 |        408,710 |
| Non-cached input tokens |    55,809 |         30,342 |

Highlight:

- 45.6% fewer non-cached input tokens;
- 20.1% fewer total input tokens;
- one additional regression case;
- same runtime implementation.

Say explicitly:

> This is one feasibility run, not a statistically significant benchmark.

### 2:50–3:00 — Close

Narration:

> Agent Haderach connects developers through the experience of their coding
> agents—so every new session can build on work the team already paid to learn.

End frame:

```text
Agent Haderach
Shared experience for coding agents
```

## Hero visualization

The strongest visual is a real-time transfer:

```text
Agent A session
      ↓ saves
[workflow] [lesson] [pitfall]
      ↓ ranked retrieval
Agent B clean session
      ↓ verifies and succeeds
ranking score increases
```

Use restrained animation tied to actual events:

- new experience cards move from Agent A to the shared store;
- ranking filters unrelated entries;
- selected cards move toward Agent B;
- test evidence turns the reused cards green;
- result counters animate only after the task completes.

## Recording checklist

- Keep the video below three minutes.
- Show the project actually running.
- Show the MCP call and response, not only slides.
- Make the two clean worktrees visually distinguishable.
- Avoid exposing credentials, environment files, or unrelated private data.
- Use enlarged terminal and UI fonts.
- Preload dependencies before any timed reproduction.
- Use recorded event replay for reliable UI animation if necessary.
- State where Codex and GPT-5.6 contributed.
- End with the measured result and its one-run limitation.

## Claims to use

- “One real-repository experience transfer.”
- “Same correct runtime implementation.”
- “One additional regression test.”
- “45.6% fewer non-cached input tokens in this observed pair.”
- “Compact summaries followed by progressive detail.”
- “Successful reuse reinforced future ranking.”

## Claims to avoid

- “Haderach always cuts tokens by 45.6%.”
- “Haderach is statistically proven to improve Codex.”
- “The second agent had no additional information.”
- “Wall time was 27.6% faster because of Haderach.”
- “The current MVP is production-ready or fully multi-tenant.”
