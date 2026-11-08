import { q, one } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  const poly = Array.isArray(b.polygon) ? b.polygon.filter((p: unknown) => Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === "number" && Number.isFinite(n))) : [];
  if (poly.length < 3 || !str(b.name)) throw bad("A zone needs a name and 3+ points");
  const color = /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : "#8da9b8";
  return one("INSERT INTO service_zones (name,color,phase,polygon) VALUES ($1,$2,$3,$4) RETURNING id", [str(b.name, 80), color, b.phase === 2 ? 2 : 1, JSON.stringify(poly)]);
});
export const DELETE = route(async (req) => {
  await requireApi(STAFF);
  await q("DELETE FROM service_zones WHERE id=$1", [str((await req.json()).id, 40)]);
  return { ok: true };
});
