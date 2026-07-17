# Product Metrics and Risks

## 21. Product metrics after the hackathon

### 21.1 Adoption

- repositories connected;
- weekly active developers;
- active agent clients;
- tasks using retrieved context;
- percentage of sessions receiving useful context.

### 21.2 Compounding value

- unique context records reused across developers;
- agent discoveries reused by later sessions;
- average age of reused knowledge;
- repeated investigations avoided;
- contexts confirmed by successful tasks;
- context coverage by repository subsystem.

### 21.3 Quality and trust

- helpful/irrelevant feedback rate;
- stale retrieval rate;
- contradiction rate;
- human correction rate;
- evidence coverage;
- secret or policy incidents;
- permission-filter failures, with a target of zero.

### 21.4 Business value

- token and model-cost reduction;
- time to first productive change in unfamiliar repositories;
- onboarding time;
- task cycle time;
- escaped regressions attributable to missed context;
- developer satisfaction.

---

## 22. Risks and mitigations

### 22.1 “This is just RAG”

**Risk:** Users or judges see only document embeddings and MCP search.

**Mitigation:** Demonstrate source-aware structure, code scoping, temporal
validity, evidence lineage, automatic shared accumulation, and measurable task
improvement.

### 22.2 Poor context is worse than missing context

**Risk:** Incorrect or stale context causes agents to make confident mistakes.

**Mitigation:** Explicit trust states, immutable provenance, revision awareness,
contradiction display, conservative automatic admission, and easy human correction.

### 22.3 Automatic capture becomes surveillance

**Risk:** Developers reject pervasive session and communication collection.

**Mitigation:** Transparent collection settings, data minimization, no private
reasoning capture, source selection, session opt-out, retention controls, and
visible audit logs.

### 22.4 Permission leakage

**Risk:** Derived context exposes information from a restricted source.

**Mitigation:** ACL inheritance, retrieval-time authorization, deletion
propagation, tenant isolation tests, and safe restrictive defaults.

### 22.5 Index grows into another context dump

**Risk:** Shared memory grows faster than retrieval quality.

**Mitigation:** Atomic records, lifecycle management, deduplication, staleness
handling, budgeted retrieval, and usage/outcome feedback.

### 22.6 Integration complexity overwhelms the MVP

**Risk:** Time is spent on OAuth and connectors rather than proving value.

**Mitigation:** Use representative exported fixtures for Slack and meetings,
one repository, and one excellent benchmark.

### 22.7 Benchmark overfitting

**Risk:** The system appears to work only because the demo context was handcrafted.

**Mitigation:** Automate ingestion and retrieval, publish fixtures, avoid storing
the solution, use hidden tests, and repeat trials.

---
