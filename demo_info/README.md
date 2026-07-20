# Agent Haderach: Judge and Demo Information

> [!IMPORTANT]
> **Before submission:** provide judges with a read-only test account through the
> hackathon's private credential field. Confirm that it opens the populated demo
> workspace and exposes the benchmark results and interaction graph. Do not put
> passwords or MCP tokens in these committed demo files.

This directory contains the concise, judge-facing material for Agent Haderach.
It separates measured results from product claims and future work.

## Recommended reading order

1. [Judge brief](01_JUDGE_BRIEF.md) — problem, product, differentiation, implementation, and impact.
2. [Evaluation report](02_EVALUATION_REPORT.md) — measured Codex comparison and limitations.
3. [Three-minute demo runbook](03_DEMO_RUNBOOK.md) — video and live-demo sequence.
4. [Verification guide](04_VERIFICATION_GUIDE.md) — how judges can run and inspect the project.
5. [Future vision](05_FUTURE_VISION.md) — cross-repository communication and agent-to-agent escalation.

## Visual story

The primary judge-facing visual story now lives on the web application's public
landing route. [The earlier before-and-after HTML slides](context-network-slides.html)
remain as a standalone concept deck and presentation reference.

## One-sentence description

> Agent Haderach is a shared experience layer for coding agents: one agent saves
> an evidenced workflow, lesson, or pitfall, and another agent retrieves and
> verifies that experience instead of repeating the investigation.

## Headline result

In one real-repository, two-agent transfer on `sindresorhus/p-limit`, the agent
using Haderach:

- produced the same correct runtime implementation;
- added one additional regression test;
- used **45.6% fewer non-cached input tokens**;
- used **20.1% fewer total input tokens**;
- reinforced the three successfully reused experience records.

This is a feasibility result from one pair of runs, not a statistically
significant benchmark. See the [evaluation report](02_EVALUATION_REPORT.md) for
the full methodology and caveats.

## Primary repository documentation

- [Project README](../README.md)
- [Original evaluation results](../docs/EVALUATION_RESULTS.md)
- [Evaluation specification](../docs/EVALUATION_SPEC.md)
- [System architecture](../docs/SYSTEM_ARCHITECTURE_SPEC.md)
- [MCP server specification](../docs/MCP_SERVER_SPEC.md)
- [Experience-store specification](../docs/CLOUD_EXPERIENCE_STORE_SPEC.md)
- [Web UI specification](../docs/WEB_UI_SPEC.md)
