import { serve } from "@hono/node-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ExperienceRepository } from "./services/experience-repository.js";
import { createApi } from "./api/routes.js";
import { createMcpServer } from "./mcp/tools.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const app = new Hono();
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok", service: "agent-haderach" }));
app.route("/api", createApi(repository));

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
