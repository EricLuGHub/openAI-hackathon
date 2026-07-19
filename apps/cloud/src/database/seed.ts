import { randomUUID } from "node:crypto";
import { ExperienceRepository } from "../services/experience-repository.js";
import type { AuthContext } from "../auth/personal-tokens.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const [legacyUser] = await repository.client`
  SELECT users.id
  FROM users
  JOIN workspace_memberships membership ON membership.user_id = users.id
  JOIN workspaces workspace ON workspace.id = membership.workspace_id
  WHERE workspace.canonical_key = 'legacy:local/repository'
  LIMIT 1`;
if (!legacyUser) throw new Error("Run db:push before db:seed");
const auth: AuthContext = {
  userId: String(legacyUser.id),
  tokenId: null,
  scopes: [
    "experience:read",
    "experience:write",
    "feedback:write",
    "session:write",
    "collaboration:read",
    "collaboration:write",
  ],
};
const sessionId = randomUUID();
await repository.startSession(
  {
    sessionId,
    repository: "legacy:local/repository",
    task: "Diagnose checkout integration pipeline",
    revision: "abc123",
    branch: "main",
  },
  auth,
);
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
  auth,
);
await repository.close();
console.log("Seed data created");
