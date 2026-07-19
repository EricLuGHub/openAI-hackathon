import postgres from "postgres";
import { PersonalTokenService, tokenScopes } from "./personal-tokens.js";

const userId = process.env.HADERACH_USER_ID;
if (!userId) throw new Error("HADERACH_USER_ID is required");

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach";
const sql = postgres(databaseUrl, { max: 1 });
try {
  const service = new PersonalTokenService(sql);
  const created = await service.create(
    userId,
    process.env.HADERACH_TOKEN_NAME ?? "Codex",
    [...tokenScopes],
  );
  console.log(
    "Personal MCP token created. Copy it now; it will not be shown again.",
  );
  console.log(created.token);
} finally {
  await sql.end();
}
