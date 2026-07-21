# KUB1 evaluator harness

## Pinned provenance

- Buggy snapshot: `df4913fe88c2a5ae73ada501df3aabb1216286e2`.
- Historical fix: Kubernetes PR [#140325](https://github.com/kubernetes/kubernetes/pull/140325), head commit `0db92c6b9646e9ffa0fbaf3049e7962b3a883c7f`, merged as `6b72c616f78e242ca3b3d0ae8eea503c59fa3b6a` on 2026-07-14.
- Bug: with `DRAListTypeAttributes` enabled, `matchAttributeConstraint.add` destructively narrowed its running intersection. `remove` decremented the device count but did not restore the prior intersection during DFS backtracking, so later valid candidates could be rejected.

The official PR changed exactly these files:

1. `staging/src/k8s.io/dynamic-resource-allocation/structured/internal/allocatortesting/allocator_testing.go` (two test cases)
2. `staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/allocator_experimental.go` (fix)
3. `staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/constraint.go` (adapts the distinct-attribute caller to the renamed/non-mutating intersection helper)

## Evaluator artifacts

- `patches/hidden-tests.patch` contains the historical tests only. Keep it outside both agents' worktrees until scoring.
- `patches/historical-fix-reference.patch` contains the historical production-code fix only. It is a judge reference, not agent context.

Hidden test cases:

- `list-attributes-match-constraint-backtrack-needs-intersection-restore` is the primary regression. It requests three devices and forces the allocator to abandon `{value1}` before finding the valid `{value2}` combination. It should fail on the buggy snapshot and pass after a correct fix.
- `list-attributes-distinct-constraint-backtrack-needs-remove` is additional backtracking coverage for the neighboring distinct constraint. It is not by itself evidence that the match-attribute bug was fixed.

SHA-256:

- `hidden-tests.patch`: `aa64d990b7416898381b6e04fad2b51b09ac5c75862fcf4599bc07fc82ad99db`
- `historical-fix-reference.patch`: `f04135641cf6681f085beb2f47a0eac668060b02e952288284c4ba1acfeb5536`

## Evaluation procedure

For each independently reset trial worktree at the pinned snapshot:

1. Apply `hidden-tests.patch` after the agent has stopped.
2. Run the repository's structured DRA allocator tests. A direct targeted command is `go test ./staging/src/k8s.io/dynamic-resource-allocation/structured/...`; use the repository's pinned build container/toolchain if the host Go version is incompatible.
3. Record the primary regression result separately from pre-existing failures and from the distinct-constraint coverage case.
4. Run the same command and environment for both clean Codex and Haderach-assisted Codex.
5. Inspect the candidate diff for scope, race/state hazards, and preservation of scalar-attribute behavior.

Expected oracle behavior:

- Buggy snapshot + hidden tests: the primary regression fails because allocation returns no valid result (or otherwise differs from the expected devices 1, 3, and 4).
- Correct candidate + hidden tests: both new cases pass, along with existing relevant tests.

## Validation and fallback rubric

Both patch artifacts were checked with `git apply --check` against the three official source files downloaded at the exact buggy revision. They apply cleanly independently; the reference patch also applies after the hidden-tests patch. Full Go execution was not completed while preparing these artifacts, so the benchmark runner must capture the actual fail/pass outputs.

If the Kubernetes build cannot be made reliable after reasonable attempts, do not discard the benchmark. Compare each candidate against `historical-fix-reference.patch` semantically:

- Does every successful list-valued `add` preserve enough prior state for LIFO `remove` to restore it?
- Does a failed `add` leave state unchanged?
- Does removing the last device reset list-valued state safely?
- Are integer, boolean, string, and version list attributes handled consistently?
- Does the change preserve scalar behavior and keep `distinctAttributeConstraint` correct?

Equivalent implementations need not use the historical stack. Per-device values plus recomputation on removal, immutable snapshots, or another demonstrably correct LIFO undo design should receive full correctness credit. Use identical rubric and evidence standards for both trials, and clearly label this fallback as static/semantic validation rather than executed-test validation.
