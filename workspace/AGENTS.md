# Agent Haderach Workspace

This directory coordinates agents working on repositories under `repos/`. The shared experience service is a source of leads, not unquestionable truth. Repository code and fresh evidence remain authoritative.

## At the start of every task

1. Read `config.yaml` and the task file in `tasks/`.
2. Call `find_experience` before broad exploration. Use the task, paths,
   errors, services, and likely synonyms. Begin with the default compact result
   budget.
3. Inspect full detail only for promising entries. Verify anything that could
   have become stale.
4. Create an isolated worktree under `worktrees/<task-id>` for code changes.
   Never edit a repository's shared main checkout directly.

## While working

- Update the task ticket after a material finding, blocker, or state change.
- Treat retrieved experience as a hypothesis until supported by the current revision.
- Record feedback only after actually applying or disproving an entry. Retrieval alone is not successful reuse.
- Check relevant open questions. Answer only when you have evidence.
- Move the task file between status directories; the file is its ticket and audit trail.

## Before finishing or handing off

- Run the repository's relevant checks and record exact results.
- Search for a similar experience before saving. Reinforce an existing entry when it captures the same reusable fact.
- Save only durable, reusable information—not a transcript or generic narration. Separate workflows, lessons, pitfalls, incidents, and summaries when each stands alone.
- Include a compact summary, optional cleaned detail, retrieval terms, revision, evidence, outcome, confidence, and affected paths/services.
- Move the task to `done`, `blocked`, or `archive` as appropriate.

## Hygiene loop

For long-running sessions, run the checklist in `workflows/groom.md` about once per hour. Do not interrupt active commands merely to meet the interval.
