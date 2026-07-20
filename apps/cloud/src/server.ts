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
import { LocalAuthService } from "./auth/local-auth.js";
import { createLocalAuthRoutes } from "./auth/local-auth-routes.js";

const databaseUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach");
if (!databaseUrl) throw new Error("DATABASE_URL is required in production");
const repository = new ExperienceRepository(databaseUrl);
const app = new Hono();
const tokens = new PersonalTokenService(repository.client);
const workspaces = new WorkspaceService(repository.client);
const localAuth = new LocalAuthService(repository.client);
const authAttempts = new Map<string, { count: number; resetsAt: number }>();
app.use(
  "*",
  cors({
    origin: process.env.WEB_APP_URL
      ? [process.env.WEB_APP_URL]
      : ["http://127.0.0.1:3000", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use("/auth/*", async (c, next) => {
  if (c.req.method !== "POST") return next();
  const now = Date.now();
  const key =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown";
  const current = authAttempts.get(key);
  const attempt =
    !current || current.resetsAt <= now
      ? { count: 1, resetsAt: now + 15 * 60_000 }
      : { ...current, count: current.count + 1 };
  authAttempts.set(key, attempt);
  if (attempt.count > 30) {
    c.header(
      "Retry-After",
      String(Math.max(1, Math.ceil((attempt.resetsAt - now) / 1000))),
    );
    return c.json({ error: "Too many authentication attempts" }, 429);
  }
  await next();
});

app.get("/health", async (c) => {
  await repository.client`SELECT 1`;
  return c.json({ status: "ok", service: "agent-haderach" });
});
app.route("/auth", createLocalAuthRoutes(localAuth));
app.route("/api", createApi(repository, tokens, workspaces, localAuth));

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
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Internal error";
  return c.json({ error: message }, 500);
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
