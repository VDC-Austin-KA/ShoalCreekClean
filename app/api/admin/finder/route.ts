import { q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

const SEGMENTS = ["property_management", "multifamily", "retail_center", "restaurant", "office_park", "storefront"];
/** Queue discovery work for the external lead-finder Worker (it picks jobs up on its next scheduled run). */
export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json().catch(() => ({}));
  const segments: string[] = Array.isArray(b.segments) && b.segments.length ? b.segments.filter((s: string) => SEGMENTS.includes(s)) : SEGMENTS;
  if (!segments.length && !b.competitor) throw bad("Choose at least one segment");
  const jobs = segments.map((segment) => ({ kind: "discover", payload: JSON.stringify({ segment }) }));
  if (b.competitor !== false) jobs.push({ kind: "competitor", payload: "{}" });
  await q("INSERT INTO finder_jobs (kind, payload) SELECT json_extract(value,'$.kind'), json_extract(value,'$.payload') FROM json_each($1)", [jobs]);
  return { queued: jobs.length };
});
