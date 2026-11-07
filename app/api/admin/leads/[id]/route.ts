import { one } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

const STAGES = ["new", "contacted", "quoted", "won", "retained", "lost"];
export const PATCH = route(async (req, { params }) => {
  await requireApi(STAFF);
  const b = await req.json();
  if (b.stage && !STAGES.includes(b.stage)) throw bad("Invalid stage");
  const r = await one(
    `UPDATE leads SET stage=COALESCE($2, stage), notes=COALESCE($3, notes), updated_at=now() WHERE id=$1 RETURNING id`,
    [(await params).id, b.stage ?? null, b.notes === undefined ? null : str(b.notes, 2000)]);
  if (!r) throw bad("Lead not found");
  return { ok: true };
});
