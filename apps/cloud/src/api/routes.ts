import { Hono } from "hono";
import {
  experienceInputSchema,
  feedbackInputSchema,
  findExperienceSchema,
} from "@haderach/contracts";
import type { ExperienceRepository } from "../services/experience-repository.js";
import {
  AuthenticationError,
  type AuthContext,
  type PersonalTokenService,
} from "../auth/personal-tokens.js";
import type { WorkspaceService } from "../services/workspace-service.js";
import { z } from "zod";
import { getCookie } from "hono/cookie";
import type { LocalAuthService } from "../auth/local-auth.js";

export function createApi(
  repository: ExperienceRepository,
  tokens: PersonalTokenService,
  workspaces: WorkspaceService,
  localAuth: LocalAuthService,
) {
  const api = new Hono<{ Variables: { auth: AuthContext } }>();

  api.use("*", async (c, next) => {
    try {
      const authorization = c.req.header("authorization");
      c.set(
        "auth",
        authorization
          ? await tokens.authenticate(authorization)
          : await localAuth.authenticate(getCookie(c, "haderach_session")),
      );
    } catch (error) {
      if (!(error instanceof AuthenticationError)) throw error;
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  });

  api.get("/me", async (c) => {
    const [user] = await repository.client`
      SELECT id, username, email, display_name, avatar_url
      FROM users WHERE id = ${c.get("auth").userId}`;
    return c.json(user);
  });

  api.get("/experiences", async (c) =>
    c.json(
      await repository.listExperiences(
        c.get("auth"),
        c.req.query("repository") ?? "",
        Number(c.req.query("limit") ?? 50),
      ),
    ),
  );
  api.post("/experiences/search", async (c) =>
    c.json(
      await repository.findExperience(
        findExperienceSchema.parse(await c.req.json()),
        c.get("auth"),
      ),
    ),
  );
  api.post("/experiences", async (c) =>
    c.json(
      await repository.createExperience(
        experienceInputSchema.parse(await c.req.json()),
        c.get("auth"),
      ),
      201,
    ),
  );
  api.get("/experiences/:id", async (c) => {
    const result = await repository.getExperience(
      c.req.param("id"),
      c.get("auth"),
      c.req.query("detail") === "full",
    );
    return result ? c.json(result) : c.json({ error: "Not found" }, 404);
  });
  api.post("/feedback", async (c) =>
    c.json(
      await repository.recordFeedback(
        feedbackInputSchema.parse(await c.req.json()),
        c.get("auth"),
      ),
    ),
  );
  api.get("/workspaces", async (c) =>
    c.json(await workspaces.list(c.get("auth"), c.req.query("q") ?? "")),
  );
  api.post("/workspaces", async (c) => {
    const input = z
      .object({ repositoryUrl: z.string().url() })
      .parse(await c.req.json());
    return c.json(
      await workspaces.create(c.get("auth"), input.repositoryUrl),
      201,
    );
  });
  api.get("/workspaces/:workspaceId", async (c) =>
    c.json(await workspaces.get(c.get("auth"), c.req.param("workspaceId"))),
  );
  api.post("/workspaces/:workspaceId/access-requests", async (c) => {
    const input = z
      .object({
        role: z.enum(["reader", "writer"]),
        message: z.string().max(500).optional(),
      })
      .parse(await c.req.json());
    return c.json(
      await workspaces.requestAccess(
        c.get("auth"),
        c.req.param("workspaceId"),
        input.role,
        input.message,
      ),
      201,
    );
  });
  api.get("/workspaces/:workspaceId/access-requests", async (c) =>
    c.json(
      await workspaces.listRequests(c.get("auth"), c.req.param("workspaceId")),
    ),
  );
  api.post(
    "/workspaces/:workspaceId/access-requests/:requestId/decision",
    async (c) => {
      const input = z
        .object({
          decision: z.enum(["approved", "rejected"]),
          reason: z.string().max(1_000).optional(),
        })
        .parse(await c.req.json());
      return c.json(
        await workspaces.decideRequest(
          c.get("auth"),
          c.req.param("workspaceId"),
          c.req.param("requestId"),
          input.decision,
          input.reason,
        ),
      );
    },
  );
  api.post(
    "/workspaces/:workspaceId/access-requests/:requestId/cancel",
    async (c) =>
      c.json(
        await workspaces.cancelRequest(
          c.get("auth"),
          c.req.param("workspaceId"),
          c.req.param("requestId"),
        ),
      ),
  );
  api.get("/workspaces/:workspaceId/members", async (c) =>
    c.json(
      await workspaces.listMembers(c.get("auth"), c.req.param("workspaceId")),
    ),
  );
  api.patch("/workspaces/:workspaceId/members/:userId", async (c) => {
    const input = z
      .object({ role: z.enum(["admin", "writer", "reader"]) })
      .parse(await c.req.json());
    return c.json(
      await workspaces.changeMemberRole(
        c.get("auth"),
        c.req.param("workspaceId"),
        c.req.param("userId"),
        input.role,
      ),
    );
  });
  api.post("/workspaces/:workspaceId/transfer-ownership", async (c) => {
    const input = z
      .object({ userId: z.string().uuid() })
      .parse(await c.req.json());
    return c.json(
      await workspaces.transferOwnership(
        c.get("auth"),
        c.req.param("workspaceId"),
        input.userId,
      ),
    );
  });

  api.get("/tokens", async (c) =>
    c.json(await tokens.list(c.get("auth").userId)),
  );
  api.post("/tokens", async (c) => {
    const input = z
      .object({ name: z.string().min(1).max(100) })
      .parse(await c.req.json());
    return c.json(await tokens.create(c.get("auth").userId, input.name), 201);
  });
  api.delete("/tokens/:tokenId", async (c) =>
    c.json(await tokens.revoke(c.get("auth").userId, c.req.param("tokenId"))),
  );

  return api;
}
