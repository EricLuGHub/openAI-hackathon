# Automatic Knowledge Accumulation

## 11. Automatic knowledge accumulation

### 11.1 Desired behavior — Decided

Developers should not need to manually maintain the shared context database during
normal work. Relevant information should update through connected sources and
agent lifecycle integrations.

### 11.2 Important protocol boundary

The MCP server can connect Codex to the cloud and expose tools and resources. An
MCP server does not inherently observe every private reasoning step or unrelated
tool call made by an agent. Truly automatic session capture therefore requires
one or more of:

- Codex lifecycle hooks;
- a Codex plugin or project configuration;
- bounded telemetry or session events explicitly authorized by the user;
- an agent wrapper or SDK integration;
- final-session extraction initiated by a lifecycle event;
- explicit MCP calls encouraged by agent instructions as a fallback.

For the hackathon, the installation may bundle MCP configuration with hooks so
the experience still feels automatic.

### 11.3 Candidate extraction

At an appropriate lifecycle point, the service receives a bounded session artifact
and extracts candidates answering questions such as:

- What was surprisingly difficult to learn?
- What would save the next developer meaningful investigation time?
- What behavior was demonstrated by code or tests?
- Which attempted approach failed, and why?
- What remains unresolved?
- Which commands or environment requirements were necessary?

### 11.4 Admission pipeline

```text
Candidate finding
  → sensitivity/secret scan
  → scope identification
  → evidence attachment
  → novelty and duplicate search
  → contradiction search
  → revision association
  → confidence/status assignment
  → publish, quarantine, or discard
```

### 11.5 Admission rules — Proposed

Automatically publish only when:

- the finding is scoped to a known repository or project;
- it has at least one inspectable evidence reference;
- it contains no detected secret or forbidden sensitive content;
- it is not merely a restatement of obvious source code;
- its confidence and source type are disclosed;
- it does not silently overwrite contradictory knowledge.

Otherwise, keep it as a private session artifact, a candidate requiring review,
or discard it.

### 11.6 Human control

Teams should configure:

- whether raw session content is uploaded;
- whether only extracted findings are uploaded;
- source retention periods;
- repositories and paths excluded from collection;
- whether agent findings require human approval;
- which teams can view or correct records;
- whether users can opt out for a session.

---
