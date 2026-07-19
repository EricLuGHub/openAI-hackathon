import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach";
const sql = postgres(databaseUrl, { max: 1 });
const migration = fileURLToPath(
  new URL("../migrations/0001_initial.sql", import.meta.url),
);
await sql.unsafe(await readFile(migration, "utf8"));
await sql.end();
console.log("Database migration complete");
