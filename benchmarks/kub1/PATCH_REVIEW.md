# KUB1 Blind Patch Review

## Review basis

The two valid candidate patches were reviewed as anonymous **Patch A** and **Patch B** before their condition labels were consulted. The frozen KUB1 rubric was applied to correctness, scope control, clarity, repository consistency, backtracking invariants, regression coverage, overfitting risk, and historical-patch similarity. The evaluator result is also part of the evidence: both candidates passed the evaluator-owned historical regression, the independent variant, the focused experimental allocator tests, and the broader structured-allocation package tests.

Scores use a five-point scale, where 5 is strongest. Similarity/leakage risk is reported separately because similarity is diagnostic, not a quality score.

## Patch A

### Summary

Patch A replaces lossy aggregate constraint state with a per-allocation record containing request, subrequest, device ID, and attribute. On removal it deletes the matching record and rebuilds the match-attribute state from the remaining allocations. It applies the same representation to the adjacent distinct-attribute constraint, fixing its inability to represent multiple selected devices from one request. It adds one backtracking regression and one distinct-attribute bookkeeping regression to the shared allocator table.

| Dimension | Score | Assessment |
| --- | ---: | --- |
| Correctness | 5 | Restores the complete logical state after arbitrary removal, for list and scalar paths, and also preserves every distinct-constraint participant. Hidden and broader tests passed. |
| Generality / backtracking invariant | 5 | Models the real invariant directly: every successful constraint mutation has an identifiable allocation record and removal reconstructs state from exactly the survivors. It does not depend on a particular device order or fixture. |
| Scope control | 4 | The match-constraint change is tightly relevant. The distinct-constraint repair broadens the production change beyond the historical failure, but fixes the same class of lossy bookkeeping defect and is backed by a focused test. |
| Clarity and maintainability | 4 | A single shared record type gives the two constraints a coherent model, and corrected comments improve accuracy. Recomputing intersections and doing a linear reverse lookup are simple and robust, though heavier than a stack-based rollback and more code than the narrow fix requires. |
| Repository consistency | 5 | Changes remain in the experimental implementation and shared cross-variant test table, use existing types and helpers, and avoid fixture-specific branches. |
| Test quality | 5 | The primary test genuinely forces search to reject a narrowed path and recover a wider intersection. The additional test catches multiple devices in one request being collapsed into one map entry. Both specify behavior through the common allocator harness. |
| Overfitting risk | 5 | Low. The implementation tracks semantic state rather than recognizing names, values, ordering, or a fixed topology. |

Notable caveats:

- Rebuilding the complete intersection on each removal is O(n) in active allocations and stores full attributes. That is acceptable for correctness and is easy to reason about, but a rollback stack can restore LIFO search state more cheaply.
- `removeConstraintAllocation` silently leaves the slice unchanged if its exact key is missing. This is safer than corrupting a counter, but it can also conceal a caller-invariant violation; an assertion or diagnostic would make failures easier to detect.
- The extra `ConsumableCapacity` feature in the distinct test does not appear essential to the behavior under test and slightly distracts from the minimal reproduction.

## Patch B

### Summary

Patch B targets the historical match-attribute failure only. It retains every successfully added list-attribute set in a device-keyed multimap, clones the initial set to avoid mutating stored inputs, and rebuilds the current intersection from the remaining sets after removal. Its shared-table regression uses a second request with a selector to reserve a device, forcing the allocator to backtrack and widen the first request's intersection.

| Dimension | Score | Assessment |
| --- | ---: | --- |
| Correctness | 5 | Correctly restores list-attribute intersection state and passed all evaluator-owned hidden, focused, and broader tests. Clone semantics prevent the running intersection from aliasing a stored operand. |
| Generality / backtracking invariant | 4 | Handles arbitrary remaining list sets and repeated use of the same device ID via a slice. It is general for the defect, although state is keyed only by device ID rather than the full request/subrequest/device allocation identity passed to `remove`. |
| Scope control | 5 | Minimal production scope: only list-valued match-attribute rollback is changed, with no unrelated constraint behavior modifications. |
| Clarity and maintainability | 4 | The comments clearly state why retained sets and rebuilding are necessary. The clone helper is straightforward. A device-keyed map is less directly aligned with the constraint API than an allocation record or LIFO stack, and map iteration makes reconstruction order nondeterministic even though mathematical set intersection is commutative. |
| Repository consistency | 5 | Stays in the experimental implementation, uses Kubernetes set cloning, and places the behavioral test in the shared allocator table. |
| Test quality | 5 | The test is especially readable: comments explain the failed first choice, the resource conflict, and the valid alternative. It validates successful backtracking rather than an internal field. |
| Overfitting risk | 5 | Low. No special cases depend on the test's request names, values, or device arrangement. |

Notable caveats:

- Removal assumes the device key exists and its slice is non-empty; otherwise slicing to `len-1` panics. The allocator's balanced add/remove discipline should guarantee this, but using the full allocation identity or checking the invariant would make the helper more defensive.
- The map groups state by `DeviceID` and ignores `requestName` and `subRequestName`. The per-device slice preserves multiplicity, so current evaluator behavior is correct, but the representation is less precise than the remove API and could make future non-LIFO or multi-request evolution harder to audit.
- Reconstruction is O(n) and allocates clones, whereas the allocator's recursive search naturally permits an intersection stack with O(1) rollback.

## Blind comparison

Both patches are production-valid, general solutions, not merely test passers. Patch A is the stronger state-modeling solution: it represents allocation identity explicitly, fixes the analogous distinct-constraint information loss, and supplies broader regression coverage. Patch B is the stronger narrowly scoped change and has the clearest single historical regression test. The tradeoff is breadth and explicitness versus minimality.

Overall blind ranking:

1. **Patch A — 4.7/5.** Preferred by a small margin for its explicit, reusable rollback model and coverage of the adjacent multi-device bookkeeping invariant.
2. **Patch B — 4.6/5.** Equally credible for the requested bug and preferable if minimizing production scope is weighted most heavily.

This is not a correctness split: both passed the strongest planned validation level. The ranking reflects maintainability judgment, not different observed behavior under the evaluator.

## Historical-reference comparison and leakage assessment

The historical patch uses an intersection stack: each successful add pushes a newly computed intersection and each LIFO removal pops it. That is more compact and asymptotically cheaper on rollback than either candidate's full reconstruction.

Patch A is structurally quite different from the historical patch. It retains source attributes as full allocation records and recomputes derived state; it also changes distinct-attribute storage, which the historical fix does not. Conceptual similarity is limited to the unavoidable invariant that removal must restore pre-add state. **Leakage risk: low.**

Patch B is also textually and structurally different from the historical patch. It retains per-device operands in a map and reconstructs the intersection, while the historical patch retains successive derived intersections in an ordered stack. Its narrow focus and clone operation solve the same defect, but neither mirrors the historical data structure or edit sequence. **Leakage risk: low.**

Neither candidate's tests resemble the historical production patch closely enough to suggest copied solution details. Patch B's test scenario is a direct and independently intelligible reproduction; Patch A's test uses a different single-request branching shape. Passing the independent hidden variant further reduces concern that either solution was overfit to a known arrangement.

## Condition reveal

- **Patch A:** `control-02`
- **Patch B:** `assisted-02`

The blind review therefore finds no correctness advantage attributable to the assisted condition in this pair. The control patch is modestly broader and more explicit; the assisted patch is modestly smaller and more focused. Any claim about assistance should rely on the separately reported process and retrieval metrics, not on a material difference in validated patch correctness.
