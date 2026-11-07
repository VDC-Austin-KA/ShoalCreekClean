import { timingSafeEqual } from "node:crypto";
import { route, bad } from "@/lib/api";
import { HttpError } from "@/lib/auth";
import { workerClient } from "@/lib/db";
import { setupDb } from "@/lib/setup";
import schemaSql from "@/db/schema.sql";
import competitorsData from "@/data/competitors.json";

/**
 * Initializes the deployed database from inside the Worker (the only place that can reach it via Hyperdrive).
 * Guarded by the SETUP_TOKEN secret; absent secret = endpoint disabled. Body: { "seed": true } loads alpha data.
 */
export const POST = route(async (req) => {
  const secret = process.env.SETUP_TOKEN ?? "";
  const given = req.headers.get("x-setup-token") ?? "";
  if (secret.length < 24 || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret))) throw new HttpError(404, "Not found");
  const { seed } = await req.json().catch(() => ({}));
  if (seed !== undefined && typeof seed !== "boolean") throw bad("seed must be boolean");
  const client = await workerClient();
  const log: string[] = [];
  try {
    await setupDb(client, { schemaSql, competitors: competitorsData.competitors, seed: !!seed, log: (m) => log.push(m) });
  } finally {
    await client.end();
  }
  return { ok: true, log };
});
