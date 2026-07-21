# KUB1 experience ingestion

This corpus is benchmark preparation, not a summary of the target fix. Ingest
only `experience/benchmark-safe.json` before solver trials. Its claims come from
predecessor PRs #137190, #135022, and #138885 and deliberately exclude PRs
#140325 and #140431, rollback/state-restoration advice, hidden-test details, and
the target device arrangement.

## Local setup

Keep account credentials and the emitted MCP token outside the repository:

```sh
export HADERACH_USERNAME='kub1-operator'
export HADERACH_EMAIL='kub1-operator@example.invalid'
export HADERACH_PASSWORD='<local secret of at least 10 characters>'
HADERACH_SECRET_FILE=/tmp/haderach-kub1.env \
  benchmarks/kub1/experience/setup-local.sh

source /tmp/haderach-kub1.env
node benchmarks/kub1/experience/ingest.mjs benchmark
```

The setup script signs in when its account already exists, reuses an existing
authorized Kubernetes workspace, and writes a newly issued token with mode 600.
The ingestion script deduplicates by the stable `[kub1-id:…]` marker. Haderach's
current API has no update/upsert endpoint, so a changed entry must receive a new
key or the old database row must be deliberately retired outside this script.

Freeze the printed SHA-256 value in the experiment manifest. That digest covers
the exact benchmark-safe JSON bytes; formatting changes therefore create a new
corpus hash. Audit the exclusions and all evidence links before freezing.

## Retrieval smoke test

Use the assisted solver's token to search for:

> Diagnose a structured DRA allocator failure involving recursive device
> selection; identify relevant architecture, sibling implementations, and the
> best regression-test location. Do not assume retrieved claims are current.

Set the search `revision` field to the sanitized starting revision
`df4913fe88c2a5ae73ada501df3aabb1216286e2`; it is required by the MCP contract.

Expected results include the allocator map and variant-parity cards. A result
must be checked against the sanitized revision before use. Retrieval by itself
must not generate successful feedback.

## Post-evaluation showcase only

After every KUB1 trial has been scored, optional mock question/answer and reuse
edges may be loaded with:

```sh
node benchmarks/kub1/experience/ingest.mjs showcase
```

After trial scoring, the two explicitly target-informed PR #140325 records can
be loaded separately with `ingest.mjs target`, or together with the mock graph
records using `ingest.mjs all-post-evaluation`. Their task summaries and source
metadata say `post-evaluation target-informed`; they are never part of the
benchmark corpus hash.

`showcase-interactions.json` and `target-informed.json` are explicitly excluded
from the frozen benchmark corpus. The interactions are mocked, while their
technical assertions remain grounded in predecessor PR evidence. Do not run
this mode before or during a measured trial. Stable entry markers prevent
duplicate records, and network evidence prevents duplicate mock reuse edges
when `HADERACH_WORKSPACE_ID` is available.
