Implemented the allocator rollback fix.

- Root cause: list attribute intersections were narrowed during `add`, but `remove` only decremented `numDevices`, leaving stale constraint state after backtracking.
- Fix: retain successful attribute sets per device and rebuild the intersection whenever an allocation is removed. This handles all list value types, repeated devices, and arbitrary backtracking depth in [allocator_experimental.go](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/assisted-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/experimental/allocator_experimental.go:840).
- Coverage: added an end-to-end case requiring `{device1, device2}` to be abandoned for `{device1, device3}`, with `device2` reserved for the next request, in [allocator_testing.go](/Users/ericlu/Works/openAI-hackathon/benchmarks/kub1/trials/assisted-02/worktree/snapshot-v1/staging/src/k8s.io/dynamic-resource-allocation/structured/internal/allocatortesting/allocator_testing.go:6054).
- `git diff --check` passes.

Both the focused regression command and the prescribed full allocator command were attempted, but neither container started:

```text
permission denied while trying to connect to the docker API at unix:///Users/ericlu/.docker/run/docker.sock
```

Thus the Go tests remain unexecuted due to sandbox Docker-socket access.