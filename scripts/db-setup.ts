// Usage: node scripts/db-setup.ts [--seed] [--remote]   (Node >= 22.18 strips TS types natively)
// Builds schema + price book + competitor research (and with --seed, a full reset + alpha data),
// writes it to .wrangler/setup.sql and applies it with `wrangler d1 execute` to the local or --remote D1.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { buildSetupSql } from "../lib/setup.ts";

const seed = process.argv.includes("--seed"), remote = process.argv.includes("--remote");
const root = new URL("../", import.meta.url);
const competitorsFile = new URL("data/competitors.json", root);
const sql = buildSetupSql({
  schemaSql: readFileSync(new URL("db/schema.sql", root), "utf8"),
  competitors: existsSync(competitorsFile) ? JSON.parse(readFileSync(competitorsFile, "utf8")).competitors : undefined,
  seed,
  passwordHash: seed ? await bcrypt.hash("alpha2026!", 10) : undefined,
});
mkdirSync(new URL(".wrangler/", root), { recursive: true });
const file = new URL(".wrangler/setup.sql", root).pathname;
writeFileSync(file, sql);
console.log(`wrote ${file} (${sql.split("\n").length} lines) → ${remote ? "REMOTE" : "local"} D1${seed ? " [reset + seed]" : ""}`);
execFileSync("npx", ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--file", file, "--yes"], { stdio: "inherit", cwd: root.pathname });
