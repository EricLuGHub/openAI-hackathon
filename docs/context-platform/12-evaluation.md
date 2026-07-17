# Evaluation Strategy

## 18. Evaluation strategy

### 18.1 Primary experiment

Compare the same Codex/GPT-5.6 configuration with and without ContextDB.

Controls:

- same repository commit;
- same task text;
- same environment and dependencies;
- same model and reasoning settings;
- clean sessions;
- identical time or tool limits;
- repeated trials if credits permit.

Avoid making Codex-versus-Claude the primary claim because model and harness
differences would confound the effect of the context system.

### 18.2 Benchmark task requirements

The task should:

- require changes across multiple files;
- contain a non-obvious behavioral constraint;
- have relevant information distributed across code and team history;
- include at least one previously rejected approach;
- be objectively testable;
- not have a solution patch stored in ContextDB;
- be difficult but solvable without ContextDB through exploration.

Example:

> Add concurrent webhook processing while preserving per-tenant ordering,
> idempotent retries, and legacy dead-letter behavior.

### 18.3 Efficiency metrics

- total input tokens;
- total output tokens;
- cached versus uncached tokens where available;
- estimated API cost;
- time to first relevant file;
- time to first edit;
- time to passing tests;
- total wall-clock time;
- number of searches;
- number of file reads;
- number of Git/GitHub history queries;
- total tool calls;
- repeated exploration actions.

### 18.4 Correctness metrics

- public tests passed;
- hidden tests passed;
- hidden behavioral assertions passed;
- historical constraints satisfied;
- regressions introduced;
- unnecessary files changed;
- security or policy violations;
- repetition of rejected approaches;
- human review findings.

### 18.5 Retrieval metrics

- context precision: relevant returned records / all returned records;
- context recall: required facts returned / all required facts;
- context utilization: returned records used or cited / all returned records;
- stale-record rate;
- unsupported-claim rate;
- permission-filter correctness;
- useful context tokens / total supplied context tokens;
- retrieval latency.

### 18.6 Avoiding a biased demonstration

- publish the benchmark repository or a reproducible fixture;
- ensure baseline Codex can access all original sources available in the repository;
- do not manually select records for the enhanced run;
- retrieve using only the task and repository state;
- keep hidden assertions out of ContextDB;
- publish run logs and evaluator code;
- distinguish prerecorded demonstration timing from measured benchmark timing;
- report unsuccessful runs, not only the best run, when possible.

---
