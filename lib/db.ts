import "server-only";
import { Pool, type QueryResultRow } from "pg";

const g = globalThis as unknown as { __pool?: Pool };
const pool =
  g.__pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
if (process.env.NODE_ENV !== "production") g.__pool = pool;

export async function q<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query<T>(sql, params);
  return res.rows;
}
export async function one<T extends QueryResultRow = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
