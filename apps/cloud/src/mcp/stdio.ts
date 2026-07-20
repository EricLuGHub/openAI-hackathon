import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ExperienceRepository } from "../services/experience-repository.js";
import { createMcpServer } from "./tools.js";
import { PersonalTokenService } from "../auth/personal-tokens.js";

const repository = new ExperienceRepository(
  process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach",
);
const rawToken = process.env.AGENT_HADERACH_TOKEN;
if (!rawToken) throw new Error("AGENT_HADERACH_TOKEN is required");
const auth = await new PersonalTokenService(repository.client).authenticate(
  `Bearer ${rawToken}`,
);
const server = createMcpServer(repository, auth);
await server.connect(new StdioServerTransport());

const shutdown = async () => {
  await repository.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
