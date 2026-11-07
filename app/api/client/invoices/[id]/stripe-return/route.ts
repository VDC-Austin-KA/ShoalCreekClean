import { NextResponse } from "next/server";
import { one, q } from "@/lib/db";
import { stripe } from "@/lib/stripe";

// Confirms a Stripe Checkout session on redirect. (Add a webhook for production durability.)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sid = new URL(req.url).searchParams.get("session_id") ?? "";
  const inv = await one("SELECT * FROM invoices WHERE id=$1 AND stripe_session=$2", [id, sid]);
  if (inv && inv.status === "open") {
    const s = await stripe(`checkout/sessions/${encodeURIComponent(sid)}`);
    if (s.payment_status === "paid") await q("UPDATE invoices SET status='paid', paid_at=now(), payment_method='Stripe' WHERE id=$1", [id]);
  }
  return NextResponse.redirect(new URL("/client/billing?paid=1", req.url));
}
