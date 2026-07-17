# Open Decisions and Current Pitch

## 23. Open product and technical decisions

These are the areas that most need further elaboration in this conversation.

### 23.1 Product identity and unit of organization — High priority

- Is the primary unit a repository, a general “space,” or both?
- Can one feature space span multiple repositories?
- Who creates and administers a space?
- Is the initial buyer/user an individual developer, a team lead, or a platform team?
- What is the final product name and category language?

### 23.2 Automatic Codex integration — High priority

- Which exact Codex surface will the demo use: CLI, IDE, or app?
- Which lifecycle events can be captured safely and reliably?
- What data will be sent automatically at session start and completion?
- Does the integration use project hooks, a plugin, an MCP server plus instructions,
  or a wrapper?
- What happens when the agent never calls the context tool?
- How does a developer pause synchronization?

### 23.3 Context ontology — High priority

- Which record types are essential for the MVP?
- What is the minimum evidence needed for each type?
- Which records are normative versus descriptive?
- How are proposals, decisions, and superseded decisions differentiated?
- How should confidence be calculated and communicated?

### 23.4 Indexing and retrieval — High priority

- What exact hybrid retrieval algorithm will be implemented first?
- How are path and symbol scopes inferred from Slack and meetings?
- How are large `AGENTS.md` files converted into atomic indexed records without
  losing hierarchy?
- How is context packed under a token budget?
- What is the fallback when no high-confidence context is found?
- How will retrieval precision and recall be evaluated?

### 23.5 Benchmark task and dataset — Highest priority

- Which repository and language will be used?
- What complex task will be assigned?
- Which facts must the agent discover?
- Where will those facts be distributed?
- Which facts are historical constraints rather than solution hints?
- What public and hidden tests establish correctness?
- How many baseline and enhanced trials are affordable?

### 23.6 Technology choices — High priority

- TypeScript-only or Next.js plus Python workers?
- Which hosted PostgreSQL provider?
- Which embedding model?
- Which code parser and which language must it support?
- Which deployment platform supports the API and workers reliably?
- Will the hackathon use real GitHub ingestion or checked-in fixtures?

### 23.7 UI scope — Medium priority

- Which view is essential to understand the product in three minutes?
- Is the context lineage graph worth its implementation cost?
- Should the default experience emphasize search, live agent activity, or evaluation?
- How much context administration is necessary for the MVP?
- What visual language communicates trust, freshness, and source authority?

### 23.8 Trust and permissions — Medium priority for MVP, critical long term

- What automatically enters shared memory?
- What requires human confirmation?
- How are private-source permissions inherited?
- What secret-scanning and redaction behavior is required?
- How is malicious or erroneous context removed?

### 23.9 Commercial direction — Later

- Hosted SaaS, self-hosted, or hybrid?
- Pricing by developer, repository, indexed volume, retrieval, or model usage?
- Is accumulated context portable and exportable?
- What becomes the durable moat?

---

## 24. Recommended next discussion order

To turn this document into an executable plan, resolve questions in this order:

1. **Benchmark story:** choose the repository, task, hidden constraints, and success metrics.
2. **MVP interaction:** decide exactly how Codex obtains context and how a session updates the cloud.
3. **Minimal context model:** select the record types, evidence rules, and scope representation needed for that story.
4. **Retrieval:** define how records are indexed, ranked, and packed for the benchmark task.
5. **Stack:** select the fastest backend, database, MCP SDK, and deployment path.
6. **UI:** design only the screens necessary to make the benchmark and trust model visible.
7. **Additional sources and automation:** add live integrations only after the core loop works.

The benchmark story should come first because it determines which portions of
the larger architecture must actually exist for the hackathon.

---

## 25. Current one-paragraph description

ContextDB is shared, cloud-hosted context infrastructure for software teams and
their AI coding agents. It continuously indexes repository instructions, code
structure, Git history, pull requests, Slack discussions, meeting transcripts,
and useful findings from previous agent sessions. Rather than loading enormous
Markdown files or forcing every agent to rediscover the repository, ContextDB
retrieves a small, task-specific set of current, permission-aware, evidence-backed
context through MCP. As developers and agents work, the shared index improves,
allowing every future session to begin with the relevant understanding already
accumulated by the team.

## 26. Current one-sentence pitch

> ContextDB gives every coding agent the relevant accumulated understanding of
> the whole team, precisely indexed and automatically kept up to date.
