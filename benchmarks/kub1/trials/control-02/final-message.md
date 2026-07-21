Implemented the allocator fix and visible regressions.

- Root cause: match constraints narrowed the list-value intersection during search, but rollback only decremented a counter. Dead-end candidates permanently poisoned later branches.
- Fix: track every constraint allocation and recompute derived intersection state after removal. Distinct constraints now also retain every device instead of overwriting devices from the same request.
- Regression coverage:
  - [allocator_testing.go:6054](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/control-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/allocatortesting/allocator_testing.go:6054)
  - [allocator_testing.go:6408](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/control-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/allocatortesting/allocator_testing.go:6408)
- State restoration: [allocator_experimental.go:996](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/control-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/allocator_experimental.go:996)
- Allocation tracking: [constraint.go:162](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/control-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/constraint.go:162)

`git diff --check` passes. The prescribed test command was attempted twice, but the managed sandbox denies access to `/Users/ericlu/.docker/run/docker.sock`; no host Go toolchain is available, so the allocator suite could not execute here.