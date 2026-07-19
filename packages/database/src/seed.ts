import { randomUUID } from "node:crypto";
import { ExperienceRepository } from "./index.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const sessionId = randomUUID();
await repository.startSession({
  sessionId,
  task: "Diagnose checkout integration pipeline",
  revision: "abc123",
  branch: "main",
});
await repository.createExperience(
  {
    sessionId,
    type: "workflow",
    taskSummary:
      "Diagnose checkout integration pipeline Redis connection failure",
    content: {
      summary:
        "Use the Jenkins integration-worker template so the Redis sidecar is available, then rerun checkout smoke tests.",
      detail:
        "The default worker template omitted Redis. Restarting with integration-worker restored the sidecar. The checkout smoke test and integration stage then passed.",
      steps: [
        "Select integration-worker template",
        "Rerun pipeline",
        "Run checkout smoke test",
      ],
    },
    scope: {
      paths: ["services/checkout/**"],
      services: ["jenkins", "redis"],
      tools: ["jenkins-mcp"],
      errorSignatures: ["connection refused"],
    },
    retrieval: {
      keywords: ["ci", "redis-sidecar", "integration-test"],
      relatedTerms: ["pipeline failure"],
      aliases: ["continuous integration"],
    },
    evidence: [{ label: "Jenkins build 1842" }],
    outcomeStatus: "successful",
    tests: ["checkout-smoke"],
    revision: "abc123",
    confidence: "verified",
    status: "current",
  },
  "demo/checkout",
);
await repository.close();
console.log("Seed data created");
