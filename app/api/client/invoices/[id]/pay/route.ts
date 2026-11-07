import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { clientForApi } from "@/lib/clientctx";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { sendMail } from "@/lib/mail";
import { usd } from "@/lib/format";

export const POST = route(async (req, { params }) => {
  const c = await clientForApi();
  const inv = await one("SELECT * FROM invoices WHERE id=$1 AND client_id=$2", [(await params).id, c.id]);
  if (!inv) throw bad("Invoice not found");
  if (inv.status !== "open") throw bad("Invoice is not open");
  const { methodId } = await req.json().catch(() => ({}));
  const base = process.env.APP_URL ?? new URL(req.url).origin;
  if (stripeEnabled() && !methodId) {
    const s = await stripe("checkout/sessions", {
      mode: "payment",
      "payment_method_types[0]": "card",
      "payment_method_types[1]": "us_bank_account",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(inv.amount_cents),
      "line_items[0][price_data][product_data][name]": `Invoice #${inv.number} — ${inv.description}`,
      customer_email: c.email,
      "metadata[invoice_id]": inv.id,
      success_url: `${base}/api/client/invoices/${inv.id}/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/client/billing`,
    });
    await q("UPDATE invoices SET stripe_session=$2 WHERE id=$1", [inv.id, s.id]);
    return { redirect: s.url };
  }
  // Simulated processor (alpha): charge a saved method.
  const pm = await one("SELECT label FROM payment_methods WHERE client_id=$1 AND ($2::uuid IS NULL OR id=$2) ORDER BY is_default DESC LIMIT 1", [c.id, methodId ?? null]);
  if (!pm) throw bad("Add a payment method first");
  await q("UPDATE invoices SET status='paid', paid_at=now(), payment_method=$2 WHERE id=$1", [inv.id, pm.label]);
  await sendMail(c.email, `Receipt for invoice #${inv.number}`, `Payment of ${usd(inv.amount_cents)} received via ${pm.label}. Download your receipt in the client portal.`, "receipt");
  return { ok: true };
});
