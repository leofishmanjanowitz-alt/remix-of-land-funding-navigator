import pg from "pg";

const url = process.env["DATABASE_URL"];
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and run `npm run db:up`.",
  );
}

export const pool = new pg.Pool({ connectionString: url, max: 4 });

/** Run `fn` inside one transaction; rolls back if it throws. */
export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
