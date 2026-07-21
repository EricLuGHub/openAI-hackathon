# KUB1 Experiment Plan: Kubernetes DRA Backtracking Bug

## Purpose

KUB1 evaluates whether repository-scoped experience retrieved through Haderach
helps Codex solve a complex historical Kubernetes bug more reliably or
efficiently than Codex working from the repository alone.

This is a controlled replay experiment. Both solving conditions receive the
same buggy source snapshot, task prompt, compute environment, model settings,
permissions, and evaluation tests. The only intended difference is access to
approved Haderach experience.

## Subject

| Field                   | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| Upstream repository     | `https://github.com/kubernetes/kubernetes`                                     |
| Historical fix          | Kubernetes PR `#140325`                                                        |
| Buggy starting revision | `df4913fe88c2a5ae73ada501df3aabb1216286e2`                                     |
| Subsystem               | Dynamic Resource Allocation structured allocator                               |
| Main behavior           | A valid device allocation may be rejected when recursive search must backtrack |
| Primary language        | Go                                                                             |

The original PR, issue, fix commit, discussions, and future repository history
are research inputs for preparing the benchmark. They are not available to the
solving agents.

## Hypothesis

Haderach will reduce repository rediscovery by giving the assisted agent compact,
relevant knowledge about the allocator architecture, testing workflow, feature
gates, and state-management invariants.

The experiment does not assume that Haderach must win. A useful result may show
that retrieval had no effect, introduced overhead, or supplied misleading
context. All outcomes must be retained.

## Success criteria

A trial succeeds only when all of the following are true:

1. The evaluator-owned regression test for the historical failure passes.
2. An independently written backtracking variant also passes.
3. Relevant existing allocator tests pass.
4. The agent did not weaken, delete, skip, or special-case the evaluation tests.
5. The patch does not introduce unrelated behavior changes.
6. The implementation addresses the general state-restoration problem rather
   than recognizing only the supplied device arrangement.

Passing only the agent's own tests does not count as success.

## Experimental conditions

### Condition A: control

Codex receives:

- the sanitized Kubernetes snapshot;
- the neutral task prompt;
- normal local code-search, editing, build, and test tools.

It does not receive Haderach access.

### Condition B: Haderach-assisted

Codex receives everything in Condition A plus:

- the Haderach MCP endpoint;
- a token authorized only for the benchmark workspace;
- an instruction to search Haderach before broad repository exploration and
  to verify retrieved claims against the checked-out revision.

### Optional Condition C: target-informed upper bound

This condition may use more specific but still sanitized experience extracted
while studying the historical target PR. It must be reported separately from
the main comparison because it has a greater risk of solution leakage.

The primary claim must be based on Conditions A and B.

## Workspace and showcase data lifecycle

KUB1 uses one Kubernetes Haderach workspace for both the controlled benchmark
and the eventual judge-facing showcase. It does not create a separate showcase
workspace. Experimental integrity comes from sequencing and frozen exports:

1. Build and test the workspace locally first. No benchmark preparation depends
   on the hosted service being available.
2. Populate a benchmark-safe corpus from repository evidence and earlier,
   related Kubernetes work.
3. Deduplicate entries before approval. Prefer updating or linking an existing
   entry when the source, claim, code scope, and lesson are materially the same.
4. Export, audit, hash, and freeze the exact approved entry set used by solver
   trials.
5. Run and score all trials against that frozen set.
6. Only after scoring, retain useful trial findings, mock interactions, reuse
   events, and additional non-leaking repository knowledge in the same
   workspace to create a richer judge demo.
7. Synchronize the locally validated workspace to the cloud after local
   ingestion, retrieval, deduplication, and graph behavior have been verified.

The hosted showcase may therefore contain more data than the frozen benchmark
export. The report must identify the export hash used during evaluation so the
larger post-trial dataset cannot be mistaken for benchmark input.

The showcase should look meaningfully populated without inflating counts with
repeated facts. It should contain varied granular entries—architecture, code
paths, test workflows, constraints, pitfalls, failed attempts, decisions, and
verified outcomes—plus provenance, reuse, and relationships between them.

## Related-PR experience-transfer scenario

The first demo storyline will simulate several past agents working on related
structured DRA changes, preserving their evidence as Haderach experience, and a
later agent retrieving the useful subset while working on KUB1. These are
mocked agent identities and interactions, but their technical claims must be
grounded in real repository and PR evidence.

### Recommended primary predecessor: PR #137190

[`kubernetes/kubernetes#137190`](https://github.com/kubernetes/kubernetes/pull/137190)
introduced list-type DRA attributes and their `matchAttribute` and
`distinctAttribute` semantics. It is the strongest predecessor because it
predates KUB1 and can legitimately teach a later agent:

- where the experimental structured allocator and constraint code live;
- that list attributes are treated as sets;
- that `matchAttribute` uses non-empty intersection semantics;
- that `distinctAttribute` uses pairwise-disjoint semantics;
- how the `DRAListTypeAttributes` feature gate reaches the allocator; and
- how shared allocator table tests express list-attribute behavior.

The simulated predecessor agent may publish those architectural and workflow
findings. It must not publish KUB1's state-restoration defect or solution.

### Supporting predecessor: PR #135022

[`kubernetes/kubernetes#135022`](https://github.com/kubernetes/kubernetes/pull/135022)
fixed value comparison in `distinctAttributeConstraint` and added cases to the
shared allocator test table. It can contribute a separate experience stream
about inspecting constraint value semantics, using the shared test harness, and
testing behavior rather than internal representation.

### Supporting predecessor: PR #138885

[`kubernetes/kubernetes#138885`](https://github.com/kubernetes/kubernetes/pull/138885)
fixed an `AllocationMode: All` structured-allocator candidate that lacked its
source pool when shared counters were consumed. It can contribute experience
about keeping stable, incubating, and experimental variants aligned and placing
cross-variant regression cases in `allocatortesting`.

### Mock interaction sequence

1. A past agent working from PR #137190 publishes feature-gate, set-semantics,
   file-location, and testing-workflow entries.
2. A second past agent working from PR #135022 adds a distinct constraint
   pitfall and links it to the shared table-test workflow instead of duplicating
   that workflow entry.
3. A third past agent working from PR #138885 reinforces the shared-harness and
   three-variant maintenance entries with new evidence and reuse provenance.
4. The KUB1 solver retrieves a compact, ranked bundle from this accumulated
   corpus. The demo graph records which entries were retrieved, applied, and
   verified.
5. The UI may show a mocked agent inquiry and a later agent response to
   demonstrate live interaction, but the benchmark value comes from the
   structured, reusable entries that remain after the interaction—not from a
   chat transcript.

PR #140431, which later centralized rollback of structured-allocator device
state, is too close to KUB1's state-restoration theme and postdates the target
starting point. It is excluded from the frozen benchmark corpus. It may be
added to the same workspace only after all KUB1 trials are scored, as clearly
marked post-evaluation showcase data.

## Phase 1: establish the benchmark manifest

Before running any solver:

1. Record the upstream repository, starting revision, historical PR, toolchain,
   focused test command, and broader validation command.
2. Save cryptographic hashes of the sanitized source archive, task prompt,
   evaluation-test patch, and approved Haderach export.
3. Record the Codex model, reasoning level, sandbox settings, web-search policy,
   time limit, and token limit.
4. Freeze the scoring rubric.
5. Assign a unique experiment version such as `kub1-v1`.

Any later change to these inputs creates a new experiment version.

## Operational failure and repair policy

The benchmark operator is authorized to diagnose and fix Haderach, MCP,
workspace, ingestion, retrieval, telemetry, test-harness, or supporting
infrastructure bugs encountered during preparation or execution, and then
continue the experiment without waiting for additional approval.

Repairs must not be hidden inside a measured result:

1. Stop and mark any trial affected by an infrastructure or application defect
   as invalid.
2. Preserve the error, logs, timing, and diagnosis as an incident artifact.
3. Implement and validate the repair.
4. If the repair changes solver-visible behavior, retrieval, stored data,
   prompts, tests, or measurement, create a new experiment version and freeze
   new hashes.
5. Rerun every affected condition from a fresh sanitized trial directory so
   control and assisted results remain comparable.
6. Continue autonomously once the repaired baseline and harness checks pass.

An invalidated run may be shown as engineering evidence in the showcase, but it
must not be included in benchmark outcome or efficiency statistics.

## Phase 2: prepare a sanitized source snapshot

1. Fetch `kubernetes/kubernetes` at the buggy revision.
2. Export that revision without later commits, remote branches, or tags.
3. Create a new local Git repository from the exported files so normal diff and
   commit workflows remain available without upstream history.
4. Remove or replace remote URLs.
5. Verify that the snapshot does not contain references to PR `#140325`, its
   issue, its fix commit, or release notes describing the solution.
6. Add only benchmark-owned instructions and visible test guidance.
7. Produce one immutable clean archive used to create every trial directory.

The control and assisted trials must never share a writable worktree.

## Phase 3: validate the bug and test harness

Before agent evaluation:

1. Build the affected package at the buggy revision.
2. Run the existing focused allocator test suite and record the baseline result.
3. Apply the hidden evaluator test patch and verify that the historical
   regression fails for the expected behavioral reason.
4. Apply the historical fix in an evaluator-only checkout and verify that all
   hidden and existing tests pass.
5. Remove the historical fix and test patch from all solver-visible artifacts.
6. Measure cold and warm test duration to choose a realistic trial timeout.

The hidden test patch should contain:

- a reconstruction of the historical list-attribute backtracking case;
- a separately designed case with different attribute values and device order;
- assertions about the resulting allocation, not the internal implementation.

## Phase 4: prepare Haderach experience

### Ingestion inputs

The ingestion agent may inspect:

- the buggy repository revision;
- contributor and testing documentation;
- relevant allocator architecture and surrounding code;
- unrelated historical DRA changes;
- the target PR only when preparing the optional target-informed condition.

### Appropriate entries

Approved experience may describe:

- where the structured DRA allocator and shared test fixtures live;
- the relationship between stable, incubating, and experimental variants;
- which behavior is selected by relevant feature gates;
- how candidates, constraints, and recursive search interact;
- how focused package tests are invoked;
- how allocator table-driven tests express claims, devices, and outcomes;
- general invariants for reversible state during speculative search;
- repository-specific debugging or validation procedures;
- pitfalls discovered while setting up or running the test suite.

### Prohibited entries

The primary assisted condition must not contain:

- the original PR or issue number;
- the historical fix commit;
- exact code or test fragments from the fix;
- a statement that the solution is an intersection stack;
- newly introduced names from the historical patch;
- the exact historical changed-file list;
- exact hidden-test device values or ordering;
- step-by-step instructions that reconstruct the winning diff.

### Leakage audit

Two reviews occur before trials begin:

1. A mechanical scan checks PR numbers, commit hashes, introduced identifiers,
   and distinctive lines from the historical patch.
2. A human review asks whether a competent engineer could reconstruct the fix
   directly from an entry without investigating the buggy code.

Every approved entry is exported and hashed. The Haderach workspace is frozen
for the duration of a trial set, except for feedback written after each trial.
Feedback must not alter the entries used by remaining trials in the same set.

## Phase 5: use a neutral solver prompt

Both primary conditions receive the same task text:

> When list-valued device attributes are enabled, the Dynamic Resource
> Allocation allocator can reject a valid allocation when finding the solution
> requires backtracking. Reproduce the failure, identify the incorrect state
> handling, implement a general fix, add appropriate visible regression
> coverage, and run the relevant allocator tests. Work only from the checked-out
> repository and the tools explicitly provided. Do not access the internet,
> upstream Git history, remote branches, issues, pull requests, release notes,
> or later revisions, and do not search for an existing implementation.

Condition B additionally receives only the operational instruction needed to
connect to and query Haderach. It does not receive a more informative bug report.

## Phase 6: execute trials

For each condition:

1. Restore a fresh trial directory from the immutable sanitized archive.
2. Start a new Codex conversation with no prior Kubernetes context.
3. Confirm web search is disabled and no upstream remote is available.
4. Start telemetry before submitting the task prompt.
5. Allow the agent to work until it declares completion, reaches the time or
   token limit, or becomes irrecoverably blocked.
6. Preserve the entire event log, commands, tool calls, patch, visible-test
   output, timestamps, and token accounting.
7. Stop the solver before applying hidden tests.
8. Copy the final patch into an evaluator-only checkout.
9. Run hidden and broader validation there.
10. Record the outcome even when the trial fails.

Run at least three trials per condition. Prefer five if time and compute allow.
Alternate or randomize condition order to reduce cache, machine-load, and
operator-order effects.

## Phase 7: evaluator commands

Exact commands must be confirmed during harness validation and then frozen.
The expected structure is:

```sh
# Focused package or variant tests used during development.
make test WHAT=./staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental

# Evaluator-only regression cases, selected by their table-test names.
make test WHAT=./staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental \
  KUBE_TEST_ARGS='-run Backtrack'
```

These commands are placeholders until tested against the exact snapshot. The
validated commands, Go version, dependency cache state, and observed runtimes
must be written into the benchmark manifest before trials start.

## Phase 8: collect metrics

### Correctness

- task success or failure;
- historical hidden-test result;
- independent hidden-test result;
- existing focused-suite result;
- broader affected-package result;
- test weakening or suspicious special-casing;
- unrelated regressions;
- patch generality and maintainability.

### Efficiency

- wall-clock time to final answer;
- time to first behaviorally correct patch;
- total input tokens;
- cached and non-cached input tokens when available;
- output tokens;
- Haderach search and detail-response tokens;
- number of tool calls;
- number of search operations;
- number of files opened;
- number of commands and test runs;
- failed build or test cycles.

### Retrieval quality

- entries returned by each query;
- entries expanded to full detail;
- position and score of useful entries;
- agent-stated or behaviorally inferred use of each entry;
- irrelevant or misleading entries;
- retrieval overhead;
- feedback submitted after evaluation.

Haderach retrieval tokens count toward the assisted condition's total cost.

## Phase 9: blind patch review

A reviewer who does not know the condition labels compares anonymized patches
using the frozen rubric:

- correctness;
- scope control;
- clarity;
- consistency with repository conventions;
- handling of backtracking invariants;
- regression-test quality;
- likelihood of overfitting;
- similarity to the historical patch.

Historical-patch similarity is diagnostic rather than automatically positive.
Very high similarity may indicate leaked solution details.

## Phase 10: analyze and report

Report every trial, not only the best pair. The report includes:

1. The frozen experiment manifest and artifact hashes.
2. Per-trial raw metrics.
3. Median, range, and individual outcomes by condition.
4. Correctness results from hidden tests.
5. Retrieval cost and usefulness.
6. Patch-review results.
7. Failures, anomalies, and protocol deviations.
8. The complete leakage audit.
9. A narrow conclusion supported by the observed data.

Acceptable language:

> In KUB1, Haderach-assisted Codex solved X of N trials compared with Y of N
> control trials, with the observed differences in time, tokens, and exploratory
> work reported below.

Avoid general claims that Haderach always reduces tokens, time, or errors.

## Required artifacts

```text
benchmarks/kub1/
├── EXPERIMENT_PLAN.md
├── manifest.json
├── prompts/
│   ├── solver.md
│   └── ingestion.md
├── patches/
│   ├── hidden-tests.patch
│   └── historical-fix-reference.patch
├── experience/
│   ├── candidates.json
│   ├── approved.json
│   └── leakage-audit.md
├── trials/
│   └── <condition>-<run>/
│       ├── metadata.json
│       ├── events.jsonl
│       ├── commands.log
│       ├── final.patch
│       └── evaluator-results.json
└── REPORT.md
```

Only `EXPERIMENT_PLAN.md` exists initially. The remaining artifacts are created
as the experiment progresses.

## Go/no-go checklist

Do not begin solving trials until:

- [ ] The buggy revision is reproducibly available.
- [ ] The sanitized archive contains no solution history.
- [ ] The affected package builds in the benchmark environment.
- [ ] The existing focused tests pass before adding hidden tests.
- [ ] Both hidden tests fail on the buggy code for the expected reason.
- [ ] Both hidden tests pass with the historical fix.
- [ ] Exact evaluator commands and timeouts are frozen.
- [ ] Haderach entries pass mechanical and human leakage review.
- [ ] Control and assisted prompts differ only by Haderach access instructions.
- [ ] Telemetry captures time, tokens, tools, commands, tests, and patches.
- [ ] Condition ordering and the minimum number of trials are chosen in advance.

## Immediate next action

Create the sanitized Kubernetes snapshot at the buggy revision and validate the
focused test command. No experience ingestion or solver trial should begin until
the harness can reproduce the failure and verify the historical fix.
