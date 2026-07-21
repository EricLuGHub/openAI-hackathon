# KUB1 benchmark report

## Result

All three measured candidates produced production patches that passed the evaluator-owned hidden tests and the focused and broader structured-allocation test suites. In the primary comparison, however, benchmark-safe Haderach assistance did **not** improve efficiency: `assisted-02` took 45.9% longer, issued 53.3% more commands, and used 117.6% more total model tokens than `control-02`. The post-evaluation, target-informed condition passed while taking 17.2% less time, 33.3% fewer commands, and 22.4% fewer total tokens than control.

Those observations are from **one valid run per condition**. They establish outcomes for these runs, not a reliable population-level effect. The target-informed result is an upper-bound/leakage-risk demonstration and is not part of the primary control-versus-assisted claim.

## Conditions and frozen inputs

The primary conditions used the same sanitized Kubernetes snapshot, neutral base task, Codex CLI, account-default model policy, high reasoning effort, one-hour limit, workspace-write sandbox, no approvals, and no web search. Control had repository tools only. Assisted additionally received Haderach operations and the frozen benchmark-safe corpus. The target-informed run used the same assisted prompt shape after ingesting two entries derived directly from the target PR; it was run only after primary scoring.

The [manifest](manifest.json) identifies Kubernetes revision `df4913fe88c2a5ae73ada501df3aabb1216286e2`, sanitized snapshot SHA-256 `9a16d746e138464c212025cb274910122be685140ac70646e900d40550cfd9bd`, Codex CLI `0.144.6`, Go/container `1.26.4`, prompt and test hashes, and a zero-match leak scan for the target PR/commit identifiers. The approved benchmark-safe export hash is `ea3777eb86203b62987026651035529fc5565cf75b27f5316d2b66c179e83d95`.

The [benchmark-safe corpus](experience/benchmark-safe.json) contains five verified entries from earlier related PRs (`#137190`, `#135022`, and `#138885`): allocator navigation, shared-test placement, list/set semantics, pointer-value comparison, candidate context, and variant parity. It explicitly excludes target PR `#140325`, later rollback guidance, and hidden-test topology. The [target-informed corpus](experience/target-informed.json) contains two post-evaluation entries from `#140325`: the precise branch-local intersection restoration invariant and the historical backtracking-test shape. Its provenance and `postEvaluationOnly` marker make it unsuitable for the primary causal comparison.

## Measured outcomes

“Input” below is the CLI-reported cumulative input-token field. “Cached input” is the reported subset served from cache; “non-cached input” is computed as input minus cached input. “Total tokens” is input plus output. Reasoning output is already a subset of output and is not added again. Command counts come from the event summarizer, not physical lines in the multiline command log.

| Run | Role | Result | Wall time | Commands | Input | Cached input | Non-cached input | Output | Reasoning output | Total tokens |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `control-02` | clean control | pass | 262.324 s | 30 | 983,331 | 916,224 | 67,107 | 11,242 | 4,849 | 994,573 |
| `assisted-02` | benchmark-safe Haderach | pass | 382.833 s | 46 | 2,149,470 | 2,053,376 | 96,094 | 14,655 | 6,625 | 2,164,125 |
| `target-informed-01` | post-evaluation upper bound | pass | 217.280 s | 20 | 763,260 | 694,784 | 68,476 | 8,810 | 3,784 | 772,070 |

Relative to control, benchmark-safe assistance increased wall time by **45.9%**, commands by **53.3%**, total input by **118.6%**, cached input by **124.1%**, non-cached input by **43.2%**, output by **30.4%**, and total tokens by **117.6%**. The large total-input difference is not merely cache accounting: both cached and non-cached input increased, although cached replay dominates the totals.

Relative to control, target-informed assistance reduced wall time by **17.2%**, commands by **33.3%**, total input by **22.4%**, cached input by **24.2%**, output by **21.6%**, and total tokens by **22.4%**; non-cached input was **2.0% higher**. Relative to benchmark-safe assistance, it reduced wall time by **43.2%**, commands by **56.5%**, and total tokens by **64.3%**.

Primary run evidence is preserved in each run's [control metadata](trials/control-02/metadata.json), [control telemetry](trials/control-02/telemetry-summary.json), [control patch](trials/control-02/final.patch), [assisted metadata](trials/assisted-02/metadata.json), [assisted telemetry](trials/assisted-02/telemetry-summary.json), [assisted patch](trials/assisted-02/final.patch), [target-informed metadata](trials/target-informed-01/metadata.json), [target-informed telemetry](trials/target-informed-01/telemetry-summary.json), and [target-informed patch](trials/target-informed-01/final.patch). Complete event streams and command logs remain beside those files.

## Evaluation design and results

The hidden patch (SHA-256 `aa64d990b7416898381b6e04fad2b51b09ac5c75862fcf4599bc07fc82ad99db`) was kept outside solver worktrees and applied only after each solver stopped. It adds two shared allocator cases taken from the historical PR: the primary `matchAttribute` regression forces a locally valid `{value1}` branch to fail before the allocator can find the valid `{value2}` combination; the neighboring `distinctAttribute` case exercises removal during backtracking. The pinned buggy snapshot was oracle-checked to fail the primary case, while the historical fix passed the focused package.

The evaluator then applied **only candidate production code**: it explicitly excluded each candidate's changes to `structured/internal/allocatortesting/allocator_testing.go`. This prevents a solver-authored test from replacing, weakening, or influencing the evaluator tests. It ran, in the pinned `golang:1.26.4-bookworm` environment:

- `go test ./staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/...`
- `go test ./staging/src/k8s.io/dynamic-resource-allocation/structured/...`

Every step passed for [control](trials/control-02/evaluator-results.json), [benchmark-safe assisted](trials/assisted-02/evaluator-results.json), and [target-informed](trials/target-informed-01/evaluator-results.json). This reached the planned `hidden_and_package_tests` validation level; no fallback rubric was needed.

The experiment plan called for an independently written backtracking variant in addition to the historical regression. The frozen hidden patch itself contains the two historical-PR cases described above, not a separately sourced independent `matchAttribute` variant. Generality is supported by production-only evaluation, broader package tests, and patch review, but this artifact set should not be reported as having executed a separate independent hidden match-attribute topology.

## Blind patch review

The [blind review](PATCH_REVIEW.md) anonymized the two primary patches before revealing conditions. Both were judged production-valid and low risk for leakage. Control (Patch A) scored 4.7/5: it used explicit per-allocation records, recomputed state from survivors, also repaired analogous distinct-constraint bookkeeping, and added broader coverage. Assisted (Patch B) scored 4.6/5: it was narrower, retained list sets in a device-keyed multimap, and rebuilt the intersection after removal. The review preferred control by a small maintainability margin while emphasizing that there was no observed correctness split. The historical patch's intersection stack is more compact and has cheaper LIFO rollback than either candidate.

The target-informed patch is deliberately not folded into that pre-reveal primary review. Its condition exposed the target defect and historical test strategy, so its efficiency is evidence that highly specific prior experience can reduce search in this instance, not evidence of benchmark-safe transfer or an unbiased product advantage.

## Invalid and incomplete attempts

Two prelaunch harness/configuration attempts produced no valid solver measurement and are excluded from every table and percentage:

- [assisted-01](trials/assisted-01/INVALID.md): the runner detected that `AGENT_HADERACH_TOKEN` was not exported to child processes and stopped before Codex launched.
- [control-01r](trials/control-01r/INVALID.md): the account rejected an explicitly configured `gpt-5` alias before repository work began.

The earlier `control-01` directory records an infrastructure incident and is likewise excluded; the measured control is the fresh hash-pinned `control-02` run. These exclusions are operational, not outcome-based.

The frozen limits specify a minimum of three trials per primary condition, but only one valid trial per condition is present. Accordingly this report does not estimate variance, statistical significance, pass-rate differences, or reproducibility across repeated trials.

## Narrow conclusions

1. On the one valid primary pair, both clean Codex and benchmark-safe Haderach produced correct production patches; assistance did not improve correctness and incurred substantial process overhead.
2. The benchmark-safe corpus supplied relevant architectural and testing knowledge, but these artifacts do not show that it reduced repository work. Any stronger claim requires repeated, order-balanced trials and retrieval-level attribution.
3. Target-specific experience produced a faster, lower-command, lower-total-token passing run. Because it directly encoded the target PR's defect and regression strategy, it is best interpreted as a solution-informed upper bound.
4. KUB1 demonstrates executable patch validity at the hidden-and-package-test level for these three runs. It does not yet demonstrate a general Haderach effect, a statistically reliable efficiency effect, or performance on an independently constructed hidden match-attribute variant.
