import "server-only";
import pg, { type QueryResultRow } from "pg";

// Two runtimes:
//  - Node (dev, Docker): one shared pool from DATABASE_URL.
//  - Cloudflare Workers: I/O objects can't be shared across requests, so each query opens a short-lived
//    client through the Hyperdrive binding, which does the real connection pooling at the edge.
const onWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const g = globalThis as unknown as { __pool?: pg.Pool };
function nodePool() {
  g.__pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  return g.__pool;
}

/** A dedicated client (caller must `end()` it). Used for multi-statement work such as setup/seed. */
export async function workerClient() {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const client = new pg.Client({ connectionString: (env as unknown as { HYPERDRIVE: { connectionString: string } }).HYPERDRIVE.connectionString });
  await client.connect();
  return client;
}

export async function q<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!onWorkers) return (await nodePool().query<T>(sql, params)).rows;
  const client = await workerClient();
  try {
    return (await client.query<T>(sql, params)).rows;
  } finally {
    client.end().catch(() => {});
  }
}
export async function one<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
export const isWorkers = onWorkers;
