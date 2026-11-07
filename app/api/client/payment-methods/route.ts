import { q } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { clientForApi } from "@/lib/clientctx";

const luhn = (n: string) => n.split("").reverse().reduce((s, d, i) => s + (i % 2 ? ((+d * 2) % 10) + Math.floor((+d * 2) / 10) : +d), 0) % 10 === 0;
const brand = (n: string) => (/^4/.test(n) ? "Visa" : /^5[1-5]|^2[2-7]/.test(n) ? "Mastercard" : /^3[47]/.test(n) ? "Amex" : /^6/.test(n) ? "Discover" : "Card");

/** Alpha: stores ONLY a display label (brand + last4). Full numbers are never persisted. Use Stripe SetupIntents in production. */
export const POST = route(async (req) => {
  const c = await clientForApi();
  const b = await req.json();
  let label: string;
  if (b.kind === "ach") {
    const acct = str(b.account, 20).replace(/\D/g, ""), routing = str(b.routing, 12).replace(/\D/g, "");
    if (routing.length !== 9 || acct.length < 4) throw bad("Enter a 9-digit routing number and account number");
    label = `${str(b.bank, 40) || "Bank"} checking •••• ${acct.slice(-4)}`;
  } else {
    const num = str(b.number, 25).replace(/\D/g, "");
    if (num.length < 13 || !luhn(num)) throw bad("Card number is invalid");
    label = `${brand(num)} •••• ${num.slice(-4)}`;
  }
  const [{ n }] = await q("SELECT count(*)::int AS n FROM payment_methods WHERE client_id=$1", [c.id]);
  await q("INSERT INTO payment_methods (client_id,kind,label,is_default) VALUES ($1,$2,$3,$4)", [c.id, b.kind === "ach" ? "ach" : "card", label, n === 0]);
  return { ok: true, label };
});
export const DELETE = route(async (req) => {
  const c = await clientForApi();
  await q("DELETE FROM payment_methods WHERE id=$1 AND client_id=$2", [str((await req.json()).id, 40), c.id]);
  return { ok: true };
});
