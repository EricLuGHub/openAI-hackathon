import { serve } from "@hono/node-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ExperienceRepository } from "./services/experience-repository.js";
import { createApi } from "./api/routes.js";
import { createMcpServer } from "./mcp/tools.js";
import {
  AuthenticationError,
  PersonalTokenService,
  type AuthContext,
} from "./auth/personal-tokens.js";
import { WorkspaceService } from "./services/workspace-service.js";
import { GitHubAuthService } from "./auth/github-auth.js";
import { createGitHubAuthRoutes } from "./auth/github-routes.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const app = new Hono();
const tokens = new PersonalTokenService(repository.client);
const workspaces = new WorkspaceService(repository.client);
const githubAuth = new GitHubAuthService(repository.client);
app.use(
  "*",
  cors({
    origin: process.env.WEB_APP_URL ?? "http://127.0.0.1:3000",
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok", service: "agent-haderach" }));
app.route("/auth", createGitHubAuthRoutes(githubAuth));
app.route("/api", createApi(repository, tokens, workspaces, githubAuth));

app.all("/mcp", async (c) => {
  let auth: AuthContext;
  try {
    auth = await tokens.authenticate(c.req.header("authorization"));
  } catch (error) {
    if (!(error instanceof AuthenticationError)) throw error;
    return c.json({ error: "Unauthorized" }, 401);
  }
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const mcp = createMcpServer(repository, auth);
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
