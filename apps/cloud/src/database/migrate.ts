import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:55432/agent_haderach";
const sql = postgres(databaseUrl, { max: 1 });
const migrationsDirectory = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;
const migrations = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+.*\.sql$/.test(name))
  .sort();
for (const name of migrations) {
  const [applied] =
    await sql`SELECT name FROM schema_migrations WHERE name = ${name}`;
  if (applied) continue;
  const source = await readFile(path.join(migrationsDirectory, name), "utf8");
  await sql.begin(async (transaction) => {
    await transaction.unsafe(source);
    await transaction`INSERT INTO schema_migrations (name) VALUES (${name})`;
  });
  console.log(`Applied migration ${name}`);
}
await sql.end();
console.log("Database migration complete");
