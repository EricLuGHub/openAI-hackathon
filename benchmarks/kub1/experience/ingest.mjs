#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const api = process.env.HADERACH_API_URL ?? "http://127.0.0.1:3001";
const token = process.env.AGENT_HADERACH_TOKEN;
if (!token) throw new Error("AGENT_HADERACH_TOKEN is required");
const mode = process.argv[2] ?? "benchmark";
if (!["benchmark", "target", "showcase", "all-post-evaluation"].includes(mode))
  throw new Error(
    "Usage: ingest.mjs [benchmark|target|showcase|all-post-evaluation]",
  );

const request = async (route, options = {}) => {
  const response = await fetch(`${api}${route}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new Error(`${response.status} ${route}: ${await response.text()}`);
  return response.json();
};

const safePath = path.join(here, "benchmark-safe.json");
const safeBytes = await readFile(safePath);
const safe = JSON.parse(safeBytes);
const existing = await request(
  `/api/experiences?repository=${encodeURIComponent(safe.repository)}&limit=500`,
);
const byKey = new Map();
for (const row of existing) {
  const match = String(row.task_summary ?? "").match(/\[kub1-id:([^\]]+)\]/);
  if (match) byKey.set(match[1], row);
}

const ids = new Map();
const ingestEntries = async (entries, corpus) => {
  for (const entry of entries) {
    if (byKey.has(entry.key)) {
      ids.set(entry.key, byKey.get(entry.key).id);
      console.log(`skip duplicate ${entry.key}`);
      continue;
    }
    const body = {
      repository: corpus.repository,
      type: entry.type,
      taskSummary: entry.taskSummary,
      content: entry.content,
      scope: entry.scope,
      retrieval: entry.retrieval,
      evidence: [
        {
          label: `Kubernetes PR #${entry.sourcePr}`,
          uri: `https://github.com/kubernetes/kubernetes/pull/${entry.sourcePr}`,
        },
        {
          label: `Immutable head revision ${entry.revision}`,
          uri: `https://github.com/kubernetes/kubernetes/commit/${entry.revision}`,
        },
      ],
      outcomeStatus: entry.outcomeStatus,
      tests: entry.tests,
      revision: entry.revision,
      confidence: entry.confidence,
      status: "current",
    };
    const created = await request("/api/experiences", {
      method: "POST",
      body: JSON.stringify(body),
    });
    ids.set(entry.key, created.id);
    console.log(`created ${entry.key} ${created.id}`);
  }
};

await ingestEntries(safe.entries, safe);

console.log(
  `benchmark corpus sha256 ${createHash("sha256").update(safeBytes).digest("hex")}`,
);
if (mode === "benchmark") process.exit(0);

if (mode === "target" || mode === "all-post-evaluation") {
  const target = JSON.parse(
    await readFile(path.join(here, "target-informed.json"), "utf8"),
  );
  if (!target.postEvaluationOnly)
    throw new Error("Target corpus must be marked postEvaluationOnly");
  await ingestEntries(target.entries, target);
  if (mode === "target") process.exit(0);
}

const showcase = JSON.parse(
  await readFile(path.join(here, "showcase-interactions.json"), "utf8"),
);
if (!showcase.postEvaluationOnly)
  throw new Error("Showcase interactions must be marked postEvaluationOnly");
for (const item of showcase.interactions) {
  if (byKey.has(item.key)) {
    ids.set(item.key, byKey.get(item.key).id);
    console.log(`skip duplicate ${item.key}`);
    continue;
  }
  const created = await request("/api/experiences", {
    method: "POST",
    body: JSON.stringify({
      repository: showcase.repository,
      type: item.type,
      sourceExperienceId: item.sourceKey ? ids.get(item.sourceKey) : undefined,
      taskSummary: item.taskSummary,
      content: { summary: item.summary, detail: item.detail, steps: [] },
      scope: {
        paths: item.paths,
        services: item.services,
        tools: [],
        errorSignatures: [],
      },
      retrieval: { keywords: item.keywords, relatedTerms: [], aliases: [] },
      evidence: [
        {
          label:
            "Mock post-evaluation interaction grounded in approved predecessor PRs",
        },
      ],
      outcomeStatus: "unknown",
      tests: [],
      revision: item.revision,
      confidence: "observed",
      status: "current",
    }),
  });
  ids.set(item.key, created.id);
  console.log(`created ${item.key} ${created.id}`);
}
for (const reuse of showcase.reuse) {
  const experienceId =
    ids.get(reuse.experienceKey) ?? byKey.get(reuse.experienceKey)?.id;
  if (!experienceId)
    throw new Error(`Unknown reuse experience key: ${reuse.experienceKey}`);
  const workspaceId = process.env.HADERACH_WORKSPACE_ID;
  const feedbackToken = process.env.AGENT_HADERACH_FEEDBACK_TOKEN ?? token;
  let network = null;
  if (workspaceId) {
    const response = await fetch(
      `${api}/api/workspaces/${workspaceId}/network`,
      {
        headers: { authorization: `Bearer ${token}` },
      },
    );
    if (response.ok) network = await response.json();
    else if (response.status !== 404)
      throw new Error(
        `${response.status} /api/workspaces/${workspaceId}/network: ${await response.text()}`,
      );
  }
  if (
    network?.edges?.some(
      (edge) => edge.kind === "reuse" && edge.evidence === reuse.evidence,
    )
  ) {
    console.log(`skip duplicate showcase reuse ${reuse.experienceKey}`);
    continue;
  }
  const response = await fetch(`${api}/api/feedback`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${feedbackToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ ...reuse, experienceId, experienceKey: undefined }),
  });
  if (!response.ok)
    throw new Error(
      `${response.status} /api/feedback: ${await response.text()}`,
    );
  console.log(`recorded showcase reuse ${reuse.experienceKey}`);
}
