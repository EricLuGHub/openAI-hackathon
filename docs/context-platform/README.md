# Shared Context Platform Specification

This directory is the source of truth for the proposed shared context platform.
The specification is split by concern so that developers and agents can load
only the context required for their current task.

The documents distinguish between **Decided**, **Proposed**, **Open**, and
**Later** items. Most implementation choices remain proposals until validated
through the benchmark and MVP.

## Reading guide

| If you are working on… | Read |
|---|---|
| Product definition, thesis, or boundaries | [Product overview](01-product-overview.md) |
| User experience and end-to-end workflows | [Users and workflows](02-users-and-workflows.md) |
| Ingestion sources, context records, scope, and ontology | [Sources and context model](03-sources-and-context-model.md) |
| Chunking, embeddings, code structure, temporal indexing, and permissions | [Indexing](04-indexing.md) |
| Hybrid search, ranking, filtering, and token-budget packing | [Retrieval](05-retrieval.md) |
| Automatic learning from developer and agent activity | [Automatic knowledge accumulation](06-automatic-knowledge-accumulation.md) |
| MCP tools, transport, authentication, and failure behavior | [MCP server](07-mcp-server.md) |
| Services, jobs, deployment, models, and technology choices | [Cloud architecture and stack](08-cloud-architecture-and-stack.md) |
| Relational schema, tables, provenance, and versioning | [Database design](09-database-design.md) |
| Screens, visual language, animations, and demo presentation | [Web UI](10-web-ui.md) |
| Permissions, secrets, privacy, and trust | [Security, privacy, and trust](11-security-privacy-and-trust.md) |
| Benchmark controls and success measurements | [Evaluation](12-evaluation.md) |
| Required build scope and three-minute presentation | [Hackathon MVP and demo](13-hackathon-mvp-and-demo.md) |
| Adoption, quality, business metrics, and project risks | [Product metrics and risks](14-product-metrics-and-risks.md) |
| Questions to resolve, decision order, and current pitches | [Open decisions and pitch](15-open-decisions-and-pitch.md) |

## Suggested reading sets

### Product discussion

Read files 01, 02, and 15.

### Retrieval implementation

Read files 03, 04, 05, and 09.

### Codex integration

Read files 06, 07, and 11.

### Hackathon execution

Read files 10, 12, 13, and the high-priority questions in 15.

### Full architecture review

Read all files in numerical order.

## Current priority

Before implementing the broad platform, define the benchmark repository, task,
hidden historical constraints, and objective evaluator. That decision determines
which ingestion, indexing, retrieval, MCP, and UI capabilities the MVP actually
needs.

