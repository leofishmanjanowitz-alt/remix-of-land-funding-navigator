import pg from "pg";

// One pool per server process. Vite reloads this module in dev, so the pool is
// kept on globalThis to avoid leaking connections on every hot reload.
const globalForDb = globalThis as typeof globalThis & { __ciPool?: pg.Pool };

export function db(): pg.Pool {
  if (!globalForDb.__ciPool) {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and run `npm run db:up`.",
      );
    }
    globalForDb.__ciPool = new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });
  }
  return globalForDb.__ciPool;
}
