import { serve } from "@hono/node-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ExperienceRepository } from "@haderach/database";
import {
  experienceInputSchema,
  feedbackInputSchema,
  findExperienceSchema,
  sessionInputSchema,
} from "@haderach/schemas";
import { createMcpServer } from "./mcp.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const app = new Hono();
app.use("*", cors());

app.use("/api/*", async (c, next) => {
  const secret = process.env.AGENT_HADERACH_API_SECRET;
  if (secret && c.req.header("authorization") !== `Bearer ${secret}`)
    return c.json({ error: "Unauthorized" }, 401);
  await next();
});

app.get("/health", (c) => c.json({ status: "ok", service: "agent-haderach" }));
app.get("/api/experiences", async (c) =>
  c.json(await repository.listExperiences(Number(c.req.query("limit") ?? 50))),
);
app.post("/api/experiences/search", async (c) =>
  c.json(
    await repository.findExperience(
      findExperienceSchema.parse(await c.req.json()),
    ),
  ),
);
app.post("/api/experiences", async (c) =>
  c.json(
    await repository.createExperience(
      experienceInputSchema.parse(await c.req.json()),
    ),
    201,
  ),
);
app.get("/api/experiences/:id", async (c) => {
  const result = await repository.getExperience(
    c.req.param("id"),
    c.req.query("detail") === "full",
  );
  return result ? c.json(result) : c.json({ error: "Not found" }, 404);
});
app.post("/api/feedback", async (c) =>
  c.json(
    await repository.recordFeedback(
      feedbackInputSchema.parse(await c.req.json()),
    ),
  ),
);
app.get("/api/sessions", async (c) => c.json(await repository.listSessions()));
app.post("/api/sessions", async (c) =>
  c.json(
    await repository.startSession(sessionInputSchema.parse(await c.req.json())),
    201,
  ),
);

app.all("/mcp", async (c) => {
  const secret = process.env.AGENT_HADERACH_API_SECRET;
  if (secret && c.req.header("authorization") !== `Bearer ${secret}`)
    return c.json({ error: "Unauthorized" }, 401);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const mcp = createMcpServer(repository);
  await mcp.connect(transport);
  return transport.handleRequest(c.req.raw);
});

app.onError((error, c) => {
  console.error(error);
  return c.json(
    { error: error instanceof Error ? error.message : "Internal error" },
    500,
  );
});

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, ({ port }) =>
  console.log(`Agent Haderach server listening on http://127.0.0.1:${port}`),
);

const shutdown = async () => {
  await repository.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
