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
    scopes: ["experience:read", "experience:write"],
  };
  const outsider: AuthContext = {
    userId: outsiderId,
    tokenId: null,
    scopes: ["experience:read"],
  };
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
    await repository.client`DELETE FROM workspaces WHERE id = ${workspaceId}`;
    await repository.client`DELETE FROM users WHERE id IN (${ownerId}, ${outsiderId})`;
    await repository.close();
  });

  it("prevents an unrelated user from reading or searching workspace experience", async () => {
    const experience = await repository.createExperience(
      {
        repository: canonicalKey,
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
    await expect(
      repository.getWorkspaceNetwork(outsider, workspaceId),
    ).rejects.toThrow("access denied");
  });

  it("allows a reader to search but not create experience", async () => {
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
    const network = await repository.getWorkspaceNetwork(outsider, workspaceId);
    expect(
      network.nodes.some((node) => node.id === `experience:${experienceId}`),
    ).toBe(true);
    expect(network.edges.some((edge) => edge.kind === "created")).toBe(true);
    await expect(
      repository.createExperience(
        {
          repository: canonicalKey,
          type: "lesson",
          taskSummary: "Unauthorized write",
          content: { summary: "Readers cannot save this", steps: [] },
          scope: { paths: [], services: [], tools: [], errorSignatures: [] },
          retrieval: { keywords: [], relatedTerms: [], aliases: [] },
          evidence: [],
          outcomeStatus: "unknown",
          tests: [],
          revision: "abc123",
          confidence: "observed",
          status: "current",
        },
        outsider,
      ),
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

  it("returns a linked answer without requiring repeated question searches", async () => {
    const base = {
      repository: canonicalKey,
      scope: { paths: [], services: [], tools: [], errorSignatures: [] },
      retrieval: { keywords: [], relatedTerms: [], aliases: [] },
      evidence: [],
      outcomeStatus: "unknown" as const,
      tests: [],
      revision: "abc123",
      confidence: "observed" as const,
      status: "current" as const,
    };
    const question = await repository.createExperience(
      {
        ...base,
        type: "question",
        taskSummary: "How should this be tested?",
        content: { summary: "Need the repository test command", steps: [] },
      },
      owner,
    );
    await repository.createExperience(
      {
        ...base,
        type: "answer",
        sourceExperienceId: String(question!.id),
        taskSummary: "Use the integration suite",
        content: { summary: "Run the integration tests", steps: [] },
      },
      owner,
    );

    const result = await repository.waitForAnswer(
      String(question!.id),
      outsider,
      1,
    );
    expect(result.status).toBe("answered");
  });
});
