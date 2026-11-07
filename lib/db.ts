import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Cloudflare D1 (SQLite) access. Locally `next dev` / `wrangler dev` use a local D1 file in .wrangler/.
// Conveniences so call sites stay readable:
//  - `$1, $2 …` placeholders are rewritten to D1's `?1, ?2 …`
//  - `now()` in SQL → current UTC timestamp in the same ISO format JS produces
//  - array/object params are stored as JSON text; JSON_COLS are parsed back on read; BOOL_COLS become booleans
type D1Result<T> = { results: T[] };
type D1Stmt = { bind: (...v: unknown[]) => D1Stmt; all: <T>() => Promise<D1Result<T>> };
export type D1 = { prepare: (sql: string) => D1Stmt; batch: (s: D1Stmt[]) => Promise<unknown[]> };

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const JSON_COLS = new Set(["equipment", "polygon", "line_items", "input", "prices", "services_claimed", "services_evidenced", "strategies", "sources", "photos",
  "emails", "phones", "people", "company_info", "fit_reasons", "brief"]);
const BOOL_COLS = new Set(["is_default"]);

async function d1(): Promise<D1> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as { DB: D1 }).DB;
}

export const toSql = (sql: string) => sql.replace(/\$(\d+)/g, "?$1").replace(/\bnow\(\)/g, NOW);
export const toParam = (v: unknown) =>
  v === undefined ? null : v instanceof Date ? v.toISOString() : typeof v === "boolean" ? (v ? 1 : 0) : v !== null && typeof v === "object" ? JSON.stringify(v) : v;
export function fromRow<T>(row: Record<string, unknown>): T {
  for (const k in row) {
    const v = row[k];
    if (JSON_COLS.has(k) && typeof v === "string") { try { row[k] = JSON.parse(v); } catch { /* leave as text */ } }
    else if (BOOL_COLS.has(k)) row[k] = !!v;
  }
  return row as T;
}

export async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const stmt = (await d1()).prepare(toSql(sql)).bind(...params.map(toParam));
  const { results } = await stmt.all<Record<string, unknown>>();
  return results.map((r) => fromRow<T>(r));
}
export async function one<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
