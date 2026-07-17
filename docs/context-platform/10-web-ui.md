# Web UI and Demo Experience

## 16. Web UI design

The UI should make an invisible infrastructure product understandable and
trustworthy. It should not look like a generic chatbot.

### 16.1 Primary navigation

```text
Organization switcher
├── Overview
├── Spaces
├── Sources
├── Context Explorer
├── Agent Sessions
├── Evaluations
└── Settings
```

### 16.2 Organization overview

Purpose: communicate value and system health.

Components:

- connected repositories and spaces;
- active developers/agents;
- context records by type and status;
- source freshness;
- recent shared findings;
- context reuse count;
- estimated discovery tokens/time avoided;
- ingestion failures and permission warnings.

### 16.3 Space overview

Shows one repository or feature space:

- repository and active branches;
- connected Slack channels and meetings;
- current features/projects;
- recently changed context;
- top referenced symbols and directories;
- unresolved contradictions;
- stale context requiring review;
- recent agent sessions and work state.

### 16.4 Context Explorer

The central search and debugging interface.

Layout:

```text
┌──────────────────────────────────────────────────────────┐
│ Search: "webhook ordering"             [Filters]        │
├───────────────────┬──────────────────────────────────────┤
│ Results           │ Selected context record              │
│                   │                                      │
│ Constraint        │ Preserve per-tenant ordering         │
│ Decision          │                                      │
│ Failed approach   │ Status: verified                     │
│ Agent finding     │ Scope: services/webhooks/**          │
│                   │ Valid at: main@91bc21                │
│                   │                                      │
│                   │ Evidence timeline                    │
│                   │ Meeting → Slack → PR → Test          │
└───────────────────┴──────────────────────────────────────┘
```

Filters:

- repository and space;
- branch/revision;
- path or symbol;
- context type;
- lifecycle status;
- source type;
- author/team;
- time range;
- confidence;
- stale/current;
- used by agent.

### 16.5 Context lineage view

This is a potential hero visualization for the demo:

```text
Architecture meeting
        │ proposed
        ▼
Slack clarification
        │ accepted
        ▼
PR #481 implementation ───→ TenantQueue.dispatch
        │                              │
        ▼                              ▼
Integration test               Current Codex task
```

Selecting a node opens the source at the relevant timestamp, thread, PR comment,
commit, file, or session event.

### 16.6 Agent session view

Shows:

- task and repository revision;
- baseline or ContextDB-enabled run;
- context automatically supplied;
- context inspected later;
- files explored;
- tests and result;
- candidate findings extracted;
- findings published or rejected;
- token, tool-call, and timing metrics.

### 16.7 Evaluation dashboard

Side-by-side baseline and enhanced runs:

| Metric | Baseline Codex | Codex + ContextDB |
|---|---:|---:|
| Input tokens | measured | measured |
| Time to first edit | measured | measured |
| Exploratory tool calls | measured | measured |
| Files read | measured | measured |
| Total completion time | measured | measured |
| Public tests passed | measured | measured |
| Hidden assertions passed | measured | measured |
| Historical constraints followed | measured | measured |

The UI should link every claim to raw run artifacts.

### 16.8 Source management

- connect/disconnect source;
- select repositories, channels, and scopes;
- show last synchronization time;
- show permission behavior;
- upload transcript fixtures;
- retry failed ingestion;
- preview what will be indexed;
- configure retention.

### 16.9 Context administration

- verify or dispute a record;
- mark superseded;
- change scope;
- attach additional evidence;
- restrict visibility;
- remove sensitive content;
- review agent-generated candidates;
- inspect audit history.

### 16.10 Demo-first visual direction — Proposed

The hackathon UI should make the context infrastructure feel active and
technically sophisticated. Motion should reveal real data flow rather than act
as unrelated decoration.

The preferred visual character is a dark, high-contrast developer interface
with restrained color assigned to source and context types:

- repository/code: blue;
- pull requests and commits: violet;
- Slack: warm magenta;
- meetings: amber;
- agent findings: cyan;
- verified context: green;
- stale or conflicting context: orange/red.

The interface should use dense but legible technical detail, monospace labels,
soft glows around active graph nodes, and clear evidence/trust indicators. It
should avoid resembling a generic analytics template or chatbot.

### 16.11 Animated ingestion sequence — Proposed hero animation

When sources are connected, animate real source events flowing into the shared
space:

```text
GitHub PR ─────┐
Slack thread ──┼──→ entity linking → indexed context graph
Meeting ───────┤
Agent session ─┘
```

Each incoming artifact becomes a node, briefly displays its extracted entities,
and forms visible links to a feature, file, symbol, or decision. Counters update
from actual ingestion events:

- artifacts processed;
- context records extracted;
- symbols linked;
- contradictions detected;
- records ready for retrieval.

The animation must be replayable for the demo and deterministic when using the
fixture dataset.

### 16.12 Live agent retrieval visualization — Proposed hero screen

When Codex requests context, the UI should show a live retrieval trace:

1. The task appears at the center of the screen.
2. Relevant concepts, paths, and symbols expand around it.
3. The larger context graph fades into view.
4. Candidate nodes pulse as lexical, semantic, structural, and temporal searches run.
5. Unauthorized, stale, or low-confidence nodes visibly fall away.
6. Selected records converge into a compact “context packet.”
7. A token meter fills only to the configured budget.
8. The packet travels visually to the Codex session.

This sequence explains the product's indexing and retrieval differentiation in
seconds without requiring the audience to read architecture diagrams.

### 16.13 Context graph interactions

- pan and zoom through a bounded graph;
- hover to preview claim, type, source, confidence, and scope;
- click a record to open its evidence lineage;
- filter nodes by source, time, status, path, symbol, and feature;
- scrub a time control to see decisions introduced or superseded;
- highlight all context applicable to a selected source-code symbol;
- switch between the complete space graph and the current task's retrieved subgraph.

The graph should be curated and clustered rather than displaying every database
row. A visually impressive but unreadable “hairball” would weaken the product.

### 16.14 Animated baseline comparison

The evaluation view should support synchronized playback of two agent runs:

```text
Baseline Codex                    Codex + ContextDB
search → read → search            context packet
       → read → git log           → targeted reads
       → incorrect approach       → correct implementation
```

During playback, animate counters for:

- elapsed time;
- input tokens;
- files opened;
- exploratory tool calls;
- required facts discovered;
- tests and hidden assertions passed.

The final comparison should settle into a clean, screenshot-friendly result
card. Metrics must come from recorded run events rather than hard-coded marketing
numbers.

### 16.15 Motion implementation — Proposed

- Use Framer Motion for page transitions, counters, context-packet assembly, and
  state changes.
- Use React Flow, Cytoscape.js, or a lightweight D3 implementation for the
  lineage and retrieval graph.
- Stream ingestion and retrieval events through Server-Sent Events or WebSockets.
- Provide a deterministic replay mode backed by recorded events for the video.
- Respect `prefers-reduced-motion` and provide a pause control.
- Keep important transitions under roughly one second; reserve longer sequences
  for the explicit demo replay.
- Precompute graph layout for the fixture dataset so the hero visualization is
  stable and does not jitter during recording.

### 16.16 Visual MVP priority

If UI time is limited, implement these in order:

1. live task-to-context retrieval visualization;
2. evidence lineage for one important constraint;
3. animated baseline-versus-enhanced metrics;
4. source ingestion animation;
5. broader administration screens.

The first three screens tell the complete hackathon story even if settings and
source management remain visually simple.

---
