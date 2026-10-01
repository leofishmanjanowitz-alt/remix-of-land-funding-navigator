/**
 * Applies db/migrations/*.sql in filename order, each in its own transaction.
 * Applied files are recorded in schema_migrations and never re-run.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool, transaction } from "./client.ts";

const DIR = path.resolve(import.meta.dirname, "../../db/migrations");

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);

const applied = new Set(
  (await pool.query<{ filename: string }>("SELECT filename FROM schema_migrations")).rows.map(
    (r) => r.filename,
  ),
);
const files = (await readdir(DIR)).filter((f) => f.endsWith(".sql")).sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(path.join(DIR, file), "utf8");
  await transaction(async (client) => {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
  });
  console.log(`applied ${file}`);
  count++;
}
console.log(count === 0 ? "database is up to date" : `${count} migration(s) applied`);
await pool.end();
