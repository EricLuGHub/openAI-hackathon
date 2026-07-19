import { Hono } from "hono";
import {
  experienceInputSchema,
  feedbackInputSchema,
  findExperienceSchema,
  sessionInputSchema,
} from "@haderach/contracts";
import type { ExperienceRepository } from "../services/experience-repository.js";

export function createApi(repository: ExperienceRepository) {
  const api = new Hono();

  api.use("*", async (c, next) => {
    const secret = process.env.AGENT_HADERACH_API_SECRET;
    if (secret && c.req.header("authorization") !== `Bearer ${secret}`) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  });

  api.get("/experiences", async (c) =>
    c.json(
      await repository.listExperiences(Number(c.req.query("limit") ?? 50)),
    ),
  );
  api.post("/experiences/search", async (c) =>
    c.json(
      await repository.findExperience(
        findExperienceSchema.parse(await c.req.json()),
      ),
    ),
  );
  api.post("/experiences", async (c) =>
    c.json(
      await repository.createExperience(
        experienceInputSchema.parse(await c.req.json()),
      ),
      201,
    ),
  );
  api.get("/experiences/:id", async (c) => {
    const result = await repository.getExperience(
      c.req.param("id"),
      c.req.query("detail") === "full",
    );
    return result ? c.json(result) : c.json({ error: "Not found" }, 404);
  });
  api.post("/feedback", async (c) =>
    c.json(
      await repository.recordFeedback(
        feedbackInputSchema.parse(await c.req.json()),
      ),
    ),
  );
  api.get("/sessions", async (c) => c.json(await repository.listSessions()));
  api.post("/sessions", async (c) =>
    c.json(
      await repository.startSession(
        sessionInputSchema.parse(await c.req.json()),
      ),
      201,
    ),
  );

  return api;
}
