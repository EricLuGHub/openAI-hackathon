Implemented the allocator fix and regression coverage.

- Root cause: list-valued match intersections were narrowed during DFS but not restored during backtracking.
- Fix: retain an intersection snapshot per allocation depth and pop it during `remove`, covering every supported attribute type.
- Regression: shared allocator test forces `{device1, device2}` to dead-end, then verifies backtracking finds `{device1, device3, device4}`.

Files:

- [allocator_experimental.go](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/target-informed-01/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/allocator_experimental.go:888)
- [allocator_testing.go](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/target-informed-01/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/allocatortesting/allocator_testing.go:6054)

`git diff --check` passes. Both the focused regression test and full requested package test were attempted, but Docker denied access to its socket before the container started:

```text
permission denied while trying to connect to the docker API
```