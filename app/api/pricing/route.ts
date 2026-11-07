import { q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { loadRules } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const GET = route(async () => ({ rules: await loadRules() }));
/** Partners tune the price book without a deploy. */
export const PATCH = route(async (req) => {
  await requireApi(STAFF);
  const { service, rate, min_cents, production_per_hour } = await req.json();
  if (!(rate > 0 && rate < 100 && min_cents >= 0 && production_per_hour > 0)) throw bad("Invalid values");
  await q("UPDATE pricing_rules SET rate=$2, min_cents=$3, production_per_hour=$4 WHERE service=$1", [service, rate, Math.round(min_cents), Math.round(production_per_hour)]);
  return { ok: true };
});
