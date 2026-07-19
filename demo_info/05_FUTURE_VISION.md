# Future Vision: A Network of Repository Agents

## Vision

Agent Haderach begins as shared experience inside one repository. Its longer-term
potential is a federated collaboration layer through which agents assigned to
different repositories can discover ownership, exchange evidenced inquiries,
and coordinate resolutions.

> Repository agents should be able to ask the agents closest to a dependency
> for help, just as developers contact the team that owns a service.

## Example: an application agent detects a Kafka problem

An agent working in an application repository encounters repeated Kafka producer
timeouts. After examining its own configuration and code, it determines that the
failure may belong to the Kafka platform repository.

Instead of stopping or guessing, it can:

1. Ask Haderach which workspace owns the affected Kafka service or capability.
2. Discover the Kafka repository's Haderach workspace.
3. Create a structured cross-repository inquiry.
4. Attach error signatures, reproduction steps, dependency versions, and
   permission-safe evidence.
5. Continue local work while the inquiry remains asynchronous.

Agents working in the Kafka workspace can then:

- identify the inquiry as a known incident;
- point to an existing workflow, lesson, or pitfall;
- verify that the requesting repository is misconfigured;
- ask the requesting agent to collect specific additional evidence;
- reproduce the issue in the Kafka repository;
- implement and validate a fix;
- publish a workaround or compatible-version recommendation;
- return the resolving PR, release, or evidence to the requester.

## End-to-end flow

```text
┌──────────────────────────────┐
│ Application repository      │
│ Agent detects Kafka failure │
└──────────────┬───────────────┘
               │ ownership lookup
               ▼
┌──────────────────────────────┐
│ Haderach workspace registry  │
│ Kafka capability → owner     │
└──────────────┬───────────────┘
               │ evidenced inquiry
               ▼
┌──────────────────────────────┐
│ Kafka repository workspace   │
│ agents validate and respond  │
└──────────────┬───────────────┘
               │ guidance, workaround, or fix
               ▼
┌──────────────────────────────┐
│ Requesting agent continues   │
│ resolution becomes reusable │
└──────────────────────────────┘
```

## Proposed inquiry object

```yaml
id: inquiry_482
requesting_workspace: commerce/checkout
suspected_owner: platform/kafka
capability: order-events
status: submitted
impact: checkout events delayed in staging
symptoms:
  - producer requests time out after 30 seconds
  - failures began after broker version update
evidence:
  - log-reference://checkout/session-821/error-19
  - git://commerce/checkout@91bc21
dependencies:
  kafka_client: 3.8.0
questions:
  - Is the staging broker currently degraded?
  - Did the new broker version change authentication requirements?
access_policy: engineering-internal
```

The inquiry contains evidence and questions, not private agent reasoning.

## Ticket lifecycle

```text
draft
  → submitted
  → acknowledged
  → investigating
  → needs_evidence
  → workaround_available
  → fix_in_progress
  → resolved
```

Alternative terminal states:

- `duplicate`
- `misrouted`
- `not_reproducible`
- `requester_resolved`
- `declined`

Each transition should retain the actor, timestamp, evidence, and explanation.

## Possible responses

### Guidance

The owning agent returns an existing validated Haderach workflow or lesson.

### Diagnostic request

The owning agent requests a specific log, metric, version, or reproduction step.

### Workaround

The owning workspace provides a safe temporary configuration or compatible
version while a permanent fix is investigated.

### Repository fix

An authorized agent creates a task or branch in the owning repository, implements
the fix, validates it, and links the resulting PR or release.

### Rejected diagnosis

The owning agent explains, with evidence, why the problem does not originate in
its system and provides pointers for the requester's next investigation.

## Required infrastructure

### Workspace and capability discovery

- registry of Haderach workspaces;
- repository and service ownership metadata;
- capability aliases such as `kafka`, `order-events`, and broker endpoints;
- contact and escalation policies;
- health and availability status.

### Federated identity and authorization

- authenticated agent and developer identity;
- organization and workspace trust relationships;
- permission-safe evidence references;
- least-privilege access to inquiry content;
- explicit authorization before creating branches, issues, or fixes.

### Routing

- deterministic ownership matching before semantic fallback;
- duplicate and known-incident detection;
- urgency and impact classification;
- rate limiting and abuse protection;
- human escalation for ambiguous ownership or high-risk changes.

### Trust and safety

- imported inquiry content treated as untrusted;
- no automatic execution of instructions from another workspace;
- evidence verification by the receiving agent;
- source and revision provenance;
- secret and sensitive-data redaction;
- audit history for every cross-workspace action;
- ability for owners to reject or quarantine malicious inquiries.

## Why this follows naturally from the MVP

The current Haderach data model already centers on:

- repository-scoped sessions;
- reusable workflows, lessons, and pitfalls;
- questions and answers;
- service incidents;
- evidence-backed outcomes;
- asynchronous reuse across clean agent sessions.

Cross-repository collaboration extends those primitives with ownership discovery,
federated permissions, and inquiry routing. It does not require agents to share
raw conversations or unrestricted repository access.

## Potential product impact

This network could help software organizations:

- reduce time spent identifying which team owns a failure;
- avoid duplicated investigations across dependent repositories;
- coordinate responses to shared infrastructure incidents;
- transfer debugging procedures across team boundaries;
- turn resolved cross-team tickets into reusable experience;
- enable asynchronous collaboration between agents operating in different time
  zones and development environments.

## Current status

This is a future product vision. The hackathon MVP demonstrates shared experience
between clean Codex sessions in one repository context. It does not yet provide:

- workspace federation;
- automatic service ownership discovery;
- cross-repository permissions;
- autonomous ticket routing;
- authorized remote fixes.

The vision is included to show how repository-level shared experience can evolve
into a broader collaboration network without overstating current capabilities.
