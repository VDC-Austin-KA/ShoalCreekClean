import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { sendMail } from "@/lib/mail";
import { usd } from "@/lib/format";

/** Partner approves a manual-review quote (optionally adjusting the total) → client can book online. */
export const POST = route(async (req, { params }) => {
  await requireApi(STAFF);
  const { total } = await req.json().catch(() => ({}));
  const cents = Number(total) > 0 ? Math.round(Number(total) * 100) : null;
  const qt = await one("UPDATE quotes SET status='estimated', total_cents=COALESCE($2,total_cents) WHERE id=$1 AND status='review' RETURNING *", [(await params).id, cents]);
  if (!qt) throw bad("Quote not awaiting review");
  await q("UPDATE leads SET stage='quoted', value_cents=$2, updated_at=now() WHERE id=$1", [qt.lead_id, qt.total_cents]);
  await sendMail(qt.input.email, `Your reviewed quote: ${usd(qt.total_cents)}`, `Hi ${qt.input.name},\n\nWe've reviewed your request. Your price is ${usd(qt.total_cents)}.\n\nBook online: ${process.env.APP_URL ?? ""}/quote/${qt.id}\n\n— Shoal Creek Clean`, "quote");
  return { ok: true };
});
