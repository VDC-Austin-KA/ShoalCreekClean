import { q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { buildPlan } from "@/lib/planner";

/** Apply the algorithmic plan: assign crews and persist optimized route order. */
export const POST = route(async (req) => {
  await requireApi(STAFF);
  const { day } = await req.json();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw bad("Invalid day");
  const plan = await buildPlan(day);
  for (const a of plan.assignments) if (a.crew_id) await q("UPDATE jobs SET crew_id=$2 WHERE id=$1 AND crew_id IS NULL", [a.job_id, a.crew_id]);
  for (const r of plan.routes) for (const [i, s] of r.stops.entries()) await q("UPDATE jobs SET route_order=$2 WHERE id=$1", [s.id, i + 1]);
  return { assigned: plan.assignments.filter((a) => a.crew_id).length, unplaced: plan.assignments.filter((a) => !a.crew_id).length };
});
