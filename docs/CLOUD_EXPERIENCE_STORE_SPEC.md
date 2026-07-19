# Cloud Experience Store and Retrieval Specification

## Status

Initial design for discussion. This document covers the cloud experience store
and its retrieval/ranking layer because their designs are tightly coupled.

## Goal

Store compact, reusable experience from coding agents and return only the most
useful information for the current task.

The system should avoid returning raw session transcripts or large unranked text
blocks. Agents receive a few concise experience records and request deeper detail
only when necessary.

## MVP tenancy and repository scope — Superseded

The following describes the completed local MVP. The next milestone replaces
this model with authenticated teams and repository isolation as specified in
`AUTHENTICATION_AND_MULTI_TENANCY_SPEC.md`.

The initial deployment supports one team and one repository. Every experience
record is implicitly associated with that repository, and every connected agent
participates in the same shared experience space.

The MVP does not require user accounts, organizations, memberships, roles, or
per-record permissions. A private deployment may run without authentication; a
public demo should use one static API secret.

The schema may retain a `repository` field to make a future migration easier,
but the application does not need multi-repository selection or tenant-aware
queries yet. Multi-team permissions and repository isolation can be added after
the shared-experience loop is proven.

## Experience types

- **Workflow:** successful sequence of actions, tools, waits, and validations.
- **Lesson:** reusable fact discovered during an investigation.
- **Pitfall:** assumption or approach that proved incorrect.
- **Summary:** conclusion, evidence, actions, and outcome of completed work.
- **Handoff:** unfinished work, blockers, and suggested next steps.
- **Incident:** recent evidence that a service or platform is unavailable.
- **Question:** scoped request for help or missing information.
- **Answer:** response to an agent question with evidence or experience.

## Experience record

```yaml
id: exp_123
type: workflow
repository: acme/checkout
task_summary: Validate checkout deployment

content:
  summary: Deploy to staging and verify payment health in Dynatrace.
  detail: |
    A longer account of the investigation, actions, reasoning conclusions,
    important outputs, exceptions, and validation results.
  steps:
    - Trigger the Jenkins deployment.
    - Wait for the integration stage.
    - Run the checkout smoke test.
    - Inspect payment failures in Dynatrace.

scope:
  paths: [services/checkout/**]
  services: [checkout, payments]
  tools: [jenkins-mcp, dynatrace-mcp]
  error_signatures: []

retrieval:
  keywords: [deployment, smoke-test, payment-health, observability]
  related_terms: [release-validation, post-deployment-monitoring]
  aliases: [CI, continuous-integration]

evidence:
  - Jenkins build 1842
  - Dynatrace query result

outcome:
  status: successful
  tests: [checkout-smoke]

revision: abc123
confidence: verified
status: current

feedback:
  successful_uses: 4
  failed_uses: 0
  usefulness_score: 0.91

ranking:
  ranking_score: 0.88
  calculated_at: 2026-07-18T14:05:00Z

created_at: 2026-07-18T12:00:00Z
last_revised_at: 2026-07-18T13:30:00Z
last_validated_at: 2026-07-18T14:00:00Z
```

Not every experience type requires every field. The shared fields should remain
consistent enough to support filtering and ranking.

### Required base fields — Decided

Every record requires `id`, `type`, `repository`, `task_summary`,
`content.summary`, `scope`, `retrieval`, `revision`, `confidence`, `status`,
`feedback`, `ranking`, `created_at`, `last_revised_at`, and `last_validated_at`.
Empty collections and default feedback values are allowed.

`content.detail`, `content.steps`, `evidence`, and `outcome` are optional because
they do not apply equally to workflows, incidents, questions, and short lessons.

`retrieval.keywords` stores precise tags, `related_terms` stores nearby concepts
or phrases, and `aliases` stores alternate names and acronyms. These values may
be proposed by the contributing agent and normalized or enriched by the cloud
service.

`revision` identifies the relevant Git revision. `last_revised_at` records when
the experience entry itself was last materially edited. `last_validated_at`
records when its accuracy or outcome was last checked.

`ranking.ranking_score` is the cloud service's current aggregate retrieval
weight. It is derived from relevance-independent signals such as confidence,
freshness, successful reuse, failed reuse, and evidence quality. The service
recalculates it as feedback and validation events arrive.

## Summary and detailed content

Every experience can have two content levels:

- **Summary:** a compact, independently useful description used for search,
  ranking, and the initial context response.
- **Detail:** a significantly larger text containing the complete useful account
  of what happened, how conclusions were reached, important outputs, caveats,
  and supporting context.

Search results return summaries by default. If an agent finds one entry highly
relevant, it can request the detailed content without loading every other
entry's details.

The detailed content may be large, but it should still be a cleaned task record,
not private chain-of-thought or an unfiltered raw transcript. Original logs,
builds, code, and other evidence should be referenced separately where possible.

Detailed content is optional. Some experiences are inherently short and are
fully expressed by their summary—for example, a brief service incident, a
single pitfall, or one precise lesson. The system should not generate filler or
repeat the summary merely to create a larger detail field. Record length should
reflect how much useful information actually exists.

## Granularity

One agent session may produce several independent records. For example, a
deployment investigation may generate:

- one workflow describing successful validation;
- one lesson about a required environment setting;
- one pitfall describing an incorrect assumption;
- one summary of the final outcome.

Records should be independently retrievable. A future agent should not need to
load an entire session to use one lesson.

### Agent-directed extraction — Decided

The contributing agent decides which parts of a session are pertinent and
reusable enough to store, and whether they should become one record or several
independent records. There is no required number of entries per session; a
session may produce many, one, or none.

The agent should prefer information that could save another agent meaningful
work, prevent a repeated mistake, reproduce a successful workflow, explain an
outcome, or enable a useful handoff. Routine actions and obvious facts should
not become entries.

The cloud service still validates the schema, searches for duplicates, applies
safety and access rules, and may reject or merge a proposed entry. It should not
replace the contributing agent's task-specific judgment with fixed chunk sizes.

## Indexing dimensions

Each record should be searchable using several signals:

- semantic similarity to the current task;
- repository;
- paths and code scope;
- service or platform;
- MCP servers and tools used;
- exact or normalized error signature;
- normalized keywords, concepts, aliases, and acronyms;
- experience type;
- repository revision;
- creation and validation time;
- confidence and current status;
- successful and failed reuse;
- usefulness feedback from later agents.

Exact error and scope matches should generally outrank loose semantic similarity.

Keywords may be supplied by the contributing agent and enriched during
ingestion. The service should normalize casing, aliases, acronyms, and obvious
duplicates. Keywords improve recall when different agents describe the same
problem differently, but they should remain one ranking signal rather than an
uncontrolled bag of generated terms.

## Retrieval request

```text
find_experience(
  task,
  repository,
  revision,
  paths?,
  services?,
  error?,
  keywords?,
  types?,
  token_budget?
)
```

Example:

```yaml
task: Diagnose the checkout integration pipeline
repository: acme/checkout
revision: def456
services: [jenkins, redis]
error: Connection refused during checkout integration
keywords: [ci, integration-test, redis-sidecar, connection-failure]
types: [workflow, lesson, pitfall, incident]
token_budget: 800
```

## Candidate retrieval

Candidate records may come from:

1. exact error-signature matching;
2. repository and scope filtering;
3. service and tool matching;
4. keyword, alias, and acronym matching;
5. semantic task similarity;
6. active incident matching;
7. related questions, answers, and handoffs.

The store should filter clearly invalid, inaccessible, or superseded records
before ranking them.

## Ranking

The initial ranking model should consider:

```text
task similarity
+ repository and path match
+ exact error match
+ service and tool match
+ keyword, alias, and acronym match
+ successful reuse
+ recent validation
+ evidence quality
- failed reuse
- staleness
- contradiction or supersession
```

The first version may use hand-tuned weights. The formula should remain visible
and testable rather than pretending an early ranking model is authoritative.

## Response format

Initial retrieval returns compact cards:

```yaml
- id: exp_123
  type: workflow
  relevance: 0.94
  summary: Restart the job with the integration-worker template.
  outcome: Successful in four later runs.
  evidence: Jenkins builds 1842 and 1861.
  freshness: Verified two days ago.
  estimated_tokens: 87
```

The default response should:

- contain approximately three to five records;
- respect the caller's token budget;
- prioritize diversity when several record types are useful;
- include confidence, freshness, and outcome;
- avoid returning duplicate conclusions;
- never include a full transcript by default.

## Progressive retrieval

```text
Search experiences
        ↓
Read compact result cards
        ↓
Inspect one selected experience
        ↓
Inspect its evidence only if necessary
```

Proposed supporting operations:

```text
get_experience(experience_id)
get_experience_evidence(experience_id)
```

`get_experience` should support a detail level:

```text
get_experience(experience_id, detail = summary | full)
```

This creates a context funnel:

```text
Many indexed entries
→ a few compact summaries
→ one selected full entry
→ specific external evidence when required
```

## Feedback loop

After using an experience, an agent may report:

```yaml
experience_id: exp_123
relevant: true
still_valid: true
outcome: successful
changes_required: none
```

Objective results should carry more weight than subjective ratings. Examples
include tests passing, pipeline recovery, successful deployment, or expected
metrics remaining healthy.

Repeated use alone does not prove quality. Failed uses, contradictions, and
staleness must lower a record's ranking.

## Duplicate reuse and reinforcement

When an agent discovers substantially the same experience as an existing record,
the system should normally avoid creating a duplicate. Instead:

1. The MCP server reports which existing experience was retrieved and reused.
2. The cloud service compares the new result with that experience.
3. If they represent the same lesson or workflow, the service records another
   use, attaches any new evidence or outcome, and updates its ranking signals.
4. If the new information materially differs, the service creates a separate
   record or a new version rather than merging it incorrectly.

Successful repetition should increase confidence and usefulness. Mere retrieval
should not: reinforcement requires evidence that the experience was applicable
or produced a successful outcome.

This behavior crosses component boundaries. The MCP integration observes and
reports reuse; the cloud store owns deduplication, evidence aggregation,
versioning, and ranking updates.

## Freshness

Past experience is guidance, not unquestioned truth. Retrieval should expose
whether:

- referenced code changed since the record was created;
- the stored revision is close to the current revision;
- the workflow's tools and services still exist;
- the experience succeeded recently;
- another record supersedes or contradicts it.

Initial statuses:

```text
current
partially_stale
stale
contradicted
superseded
```

## Key design rule

> Store experience as small, independently retrievable units and return only the
> records most likely to help the current task.

## Open decisions

1. Which database and search technology should implement hybrid retrieval?
2. How should ranking weights be initialized?
3. How should usefulness and confidence be calculated?
4. How should code changes invalidate or downgrade experience?
5. How much agent feedback should be automatic versus explicitly requested?
