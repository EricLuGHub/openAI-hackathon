# Product Overview

## Document status

- **Working product name:** ContextDB (placeholder)
- **Product category:** Shared context infrastructure for software teams and AI coding agents
- **Primary interface:** Cloud service accessed by an MCP server and supporting integrations
- **Primary hackathon client:** Codex
- **Target hackathon track:** Developer Tools
- **Status:** Discovery and architecture definition

### Decision labels

This document uses the following labels:

- **Decided:** central to the current product direction.
- **Proposed:** recommended default that still needs validation.
- **Open:** requires discussion or experimentation.
- **Later:** valuable, but outside the first implementation.

---

## 1. Executive summary

Software repositories preserve code but do not preserve all of the understanding
required to work on that code. Important context is distributed across large
`AGENTS.md` and `CLAUDE.md` files, source code, pull requests, commit history,
Slack conversations, meetings, tickets, incident reports, developer knowledge,
and previous AI-agent sessions.

ME: The main problem remains that specs and other md files are BIG and difficult to navigate both for the AI and even more for humans. They are often thousands and thousands of lines of text.

Coding agents repeatedly rediscover this information. Different developers and
their agents perform overlapping searches, read the same files, repeat failed
approaches, miss historical constraints, and consume time and tokens rebuilding
an understanding that somebody on the team already developed.

ME: This is a little like everytime we /exit out of Codex that resume ID has value, and what if we could store it

ContextDB is a cloud-hosted, shared, continuously updated context infrastructure
for a repository or engineering space. It ingests organizational knowledge,
indexes it across semantic, structural, temporal, and provenance dimensions,
and makes the smallest useful set of context available to coding agents through
MCP.

The system is designed to make context:

- shared across developers and agents;
- automatically synchronized rather than manually maintained;
- precisely searchable by task, repository, code location, symbol, feature, and time;
- traceable to its original source;
- aware of whether information is current, disputed, or superseded;
- permission-aware;
- compact enough to reduce unnecessary model context;
- useful across sessions, machines, branches, and supported agent clients.

The core product promise is:

> Every coding agent starts with the relevant understanding accumulated by the
> team, rather than rediscovering the repository from scratch.

An alternative short description is:

> Git shares the code. ContextDB shares and indexes everything the team learned
> while building it.

---

## 2. Problem definition

### 2.1 Repository instructions do not scale cleanly

Teams increasingly store agent guidance in files such as `AGENTS.md`,
`CLAUDE.md`, rules files, READMEs, and internal design documents. These files are
useful, but they have limitations:

- they grow into large, expensive context blocks;
- their instructions cover scopes ranging from the whole organization to one function;
- duplicated instructions can disagree;
- obsolete rules are rarely removed reliably;
- the agent may load irrelevant instructions for the current task;
- developers must know where the relevant document lives;
- knowledge remains document-shaped rather than task-shaped;
- much of the real rationale never reaches these files.

### 2.2 Important engineering knowledge lives outside the repository

The reason behind an implementation may exist only in:

- a Slack thread;
- an architecture meeting transcript;
- a pull-request review comment;
- a rejected pull request;
- a ticket discussion;
- an incident retrospective;
- a developer's local investigation;
- an earlier coding-agent session.

The code normally reveals what exists. It does not always reveal why it exists,
what alternatives failed, or which external constraints must remain true.

### 2.3 Agent knowledge does not compound

An agent can spend thousands of tokens learning that:

- a particular test requires a local service;
- a seemingly unused function is called dynamically;
- a subsystem has a non-obvious concurrency constraint;
- an obvious implementation was rejected in an earlier PR;
- a flaky test has a known root cause.

That discovery is usually trapped inside one conversation. The next agent pays
the same discovery cost.

### 2.4 Existing search is not enough

Keyword search and vector similarity can retrieve related text, but engineering
context also requires answers to questions such as:

- Does this statement apply to the current repository and branch?
- Does it apply globally, to one directory, or to one symbol?
- Was it a proposal, a final decision, or an abandoned idea?
- Was it superseded by a later decision?
- What evidence supports it?
- Does the requesting user have permission to view its source?
- Is it important enough to spend context tokens on for this task?

---

## 3. Product thesis

### 3.1 Primary thesis — Decided

A shared and well-indexed context layer can reduce repeated repository
rediscovery and help coding agents perform complex work faster, with fewer
tokens and fewer context-related mistakes.

### 3.2 Supporting hypotheses — To validate

1. A meaningful portion of coding-agent exploration repeats work performed by
   previous developers or agents.
2. Historical decisions and operational findings improve task correctness when
   retrieved at the right time.
3. Task-specific context can outperform large, always-loaded instruction files
   while using fewer tokens.
4. Developers will adopt the system if ingestion and contribution are mostly
   automatic.
5. Evidence and freshness indicators can make shared agent-generated memory
   trustworthy enough to influence coding work.
6. Context accumulated across a team becomes more valuable over time.

### 3.3 Hackathon claim — Proposed

For one controlled repository task, Codex with ContextDB will:

- consume fewer input tokens;
- perform fewer exploratory searches and file reads;
- reach passing tests faster;
- satisfy more hidden historical constraints;
- avoid at least one previously documented failed approach;

than an otherwise equivalent clean Codex session without ContextDB.

---

## 4. Product boundaries

### 4.1 What the product is — Decided

- Shared context infrastructure for a repository, project, or organization.
- A cloud database and retrieval service, not merely a local Markdown utility.
- A multi-source index of engineering knowledge.
- An automatic synchronization layer for code and collaboration sources.
- An MCP-accessible context service for coding agents.
- A persistent memory shared across developers and agent sessions.
- A task-aware retrieval system that observes a configurable token budget.
- A provenance and lifecycle system for engineering knowledge.

### 4.2 What the product is not — Decided

- Not only a vector database.
- Not only semantic search over Slack and Markdown.
- Not a replacement for Git.
- Not a general enterprise search product in the MVP.
- Not primarily a documentation compiler.
- Not a system that requires developers to manually rewrite all knowledge into
  a new format.
- Not a system that treats every conversation or agent statement as fact.
- Not a system that gives every agent unrestricted access to every team source.
- Not an autonomous code-writing agent.

### 4.3 Relationship to existing files

`AGENTS.md`, `CLAUDE.md`, and related documents remain valid input sources.
ContextDB indexes their individual instructions and associates them with scope,
source, revision, and priority. It does not require teams to delete these files.

The long-term product may optionally generate or validate repository guidance,
but document generation is not the central concept.

---
