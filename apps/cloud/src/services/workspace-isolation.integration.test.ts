import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PersonalTokenService,
  type AuthContext,
} from "../auth/personal-tokens.js";
import { ExperienceRepository } from "./experience-repository.js";

const run = Boolean(process.env.DATABASE_URL);
const suite = run ? describe : describe.skip;

suite("workspace isolation", () => {
  let repository: ExperienceRepository;
  const ownerId = randomUUID();
  const outsiderId = randomUUID();
  const workspaceId = randomUUID();
  const canonicalKey = `github:test/${randomUUID()}`;
  const owner: AuthContext = {
    userId: ownerId,
    tokenId: null,
    scopes: ["experience:read", "experience:write", "session:write"],
  };
  const outsider: AuthContext = {
    userId: outsiderId,
    tokenId: null,
    scopes: ["experience:read", "session:write"],
  };
  let sessionId = "";
  let experienceId = "";

  beforeAll(async () => {
    repository = new ExperienceRepository(process.env.DATABASE_URL!);
    await repository.client`
      INSERT INTO users (id, display_name) VALUES
        (${ownerId}, 'Isolation owner'), (${outsiderId}, 'Isolation outsider')`;
    await repository.client`
      INSERT INTO workspaces
        (id, created_by_user_id, owner_user_id, canonical_key, provider,
         repository_owner, repository_name, remote_url)
      VALUES
        (${workspaceId}, ${ownerId}, ${ownerId}, ${canonicalKey}, 'github',
         'test', 'isolation', 'https://github.com/test/isolation')`;
    await repository.client`
      INSERT INTO workspace_memberships
        (id, workspace_id, user_id, role, granted_by_user_id)
      VALUES (${randomUUID()}, ${workspaceId}, ${ownerId}, 'owner', ${ownerId})`;
  });

  afterAll(async () => {
    await repository.client`DELETE FROM experience_feedback WHERE workspace_id = ${workspaceId}`;
    await repository.client`DELETE FROM experiences WHERE workspace_id = ${workspaceId}`;
    await repository.client`DELETE FROM sessions WHERE workspace_id = ${workspaceId}`;
    await repository.client`DELETE FROM workspaces WHERE id = ${workspaceId}`;
    await repository.client`DELETE FROM users WHERE id IN (${ownerId}, ${outsiderId})`;
    await repository.close();
  });

  it("prevents an unrelated user from reading or searching workspace experience", async () => {
    const session = await repository.startSession(
      { repository: canonicalKey, task: "Isolation test", revision: "abc123" },
      owner,
    );
    sessionId = String(session.id);
    const experience = await repository.createExperience(
      {
        sessionId,
        type: "lesson",
        taskSummary: "Workspace isolation",
        content: { summary: "Only members can retrieve this", steps: [] },
        scope: { paths: [], services: [], tools: [], errorSignatures: [] },
        retrieval: { keywords: ["isolation"], relatedTerms: [], aliases: [] },
        evidence: [],
        outcomeStatus: "successful",
        tests: [],
        revision: "abc123",
        confidence: "verified",
        status: "current",
      },
      owner,
    );
    expect(experience).toBeDefined();
    experienceId = String(experience!.id);
    expect(
      await repository.getExperience(experienceId, outsider),
    ).toBeUndefined();
    await expect(
      repository.findExperience(
        {
          repository: canonicalKey,
          task: "isolation",
          revision: "abc123",
          paths: [],
          services: [],
          keywords: [],
          types: [],
          tokenBudget: 800,
          limit: 5,
        },
        outsider,
      ),
    ).rejects.toThrow("access denied");
  });

  it("allows a reader to search but not mutate sessions", async () => {
    await repository.client`
      INSERT INTO workspace_memberships
        (id, workspace_id, user_id, role, granted_by_user_id)
      VALUES (${randomUUID()}, ${workspaceId}, ${outsiderId}, 'reader', ${ownerId})`;
    const results = await repository.findExperience(
      {
        repository: canonicalKey,
        task: "isolation",
        revision: "abc123",
        paths: [],
        services: [],
        keywords: [],
        types: [],
        tokenBudget: 800,
        limit: 5,
      },
      outsider,
    );
    expect(results.some((entry) => entry.id === experienceId)).toBe(true);
    await expect(
      repository.updateSession(sessionId, { status: "completed" }, outsider),
    ).rejects.toThrow("access denied");
  });

  it("authenticates and immediately revokes a non-expiring personal token", async () => {
    const service = new PersonalTokenService(repository.client);
    const created = await service.create(ownerId, "Integration test");
    const authenticated = await service.authenticate(`Bearer ${created.token}`);
    expect(authenticated.userId).toBe(ownerId);
    await service.revoke(ownerId, created.id);
    await expect(
      service.authenticate(`Bearer ${created.token}`),
    ).rejects.toThrow("Unauthorized");
  });
});
