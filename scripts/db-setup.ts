// Usage: node scripts/db-setup.ts [--seed]   (Node >= 22.18 strips TS types natively)
// Applies db/schema.sql + competitor research; with --seed, wipes and loads alpha-test data.
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";
import { setupDb } from "../lib/setup.ts";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
await db.connect();
const competitorsFile = new URL("../data/competitors.json", import.meta.url);
await setupDb(db, {
  schemaSql: readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"),
  competitors: existsSync(competitorsFile) ? JSON.parse(readFileSync(competitorsFile, "utf8")).competitors : undefined,
  seed: process.argv.includes("--seed"),
});
await db.end();
