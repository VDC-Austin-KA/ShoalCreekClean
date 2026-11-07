import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { q, one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { sendMail } from "@/lib/mail";

/** Accept an instant quote: creates client account (if new) + unassigned job + magic login link. */
export const POST = route(async (req, { params }) => {
  const { id } = await params;
  const { date } = await req.json();
  const quote = await one("SELECT * FROM quotes WHERE id=$1", [id]);
  if (!quote) throw bad("Quote not found");
  if (quote.status !== "estimated") throw bad(quote.status === "accepted" ? "Already booked" : "This quote needs partner review first");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
  const inp = quote.input;
  const lead = await one("SELECT * FROM leads WHERE id=$1", [quote.lead_id]);
  let user = await one("SELECT id, role FROM users WHERE email=$1", [inp.email]);
  if (!user) user = await one("INSERT INTO users (email,name,role,password_hash) VALUES ($1,$2,'client',$3) RETURNING id, role", [inp.email, inp.name, await bcrypt.hash(randomBytes(16).toString("hex"), 10)]);
  let client = await one("SELECT id FROM clients WHERE user_id=$1", [user!.id]);
  if (!client) client = await one(
    "INSERT INTO clients (user_id,company,contact_name,email,segment,address,lat,lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [user!.id, inp.company || null, inp.name, inp.email, lead?.segment ?? "residential", inp.address || inp.city, lead?.lat, lead?.lng]);
  const services: string[] = quote.line_items.map((l: any) => l.service).filter((s: string) => !["lift", "after_hours"].includes(s));
  const rules = await q("SELECT equipment FROM pricing_rules WHERE service = ANY($1)", [services]);
  await q(
    `INSERT INTO jobs (client_id,quote_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,crew_size,equipment,frequency,price_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,($8::date + time '08:00') AT TIME ZONE 'America/Chicago',$9,$10,$11,$12,$13)`,
    [client!.id, id, quote.line_items.map((l: any) => l.label).join(" + ").slice(0, 120), services[0] ?? "flatwork", inp.address || inp.city, lead?.lat ?? 30.2672, lead?.lng ?? -97.7431,
     day, Math.round(Number(quote.est_hours) * 60), quote.crew_size, [...new Set(rules.flatMap((r) => r.equipment.slice(0, 1)))], inp.frequency, quote.total_cents]);
  await q("UPDATE quotes SET status='accepted', client_id=$2 WHERE id=$1", [id, client!.id]);
  if (lead) await q("UPDATE leads SET stage='won', updated_at=now() WHERE id=$1", [lead.id]);
  const token = randomBytes(24).toString("base64url");
  await q("INSERT INTO magic_links (token_hash,user_id,expires_at) VALUES ($1,$2, now() + interval '7 days')", [createHash("sha256").update(token).digest("hex"), user!.id]);
  const link = `${process.env.APP_URL ?? ""}/api/auth/magic?token=${token}`;
  await sendMail(inp.email, "You're booked! Access your client portal", `Hi ${inp.name},\n\nYour service is requested for ${day}. We'll confirm your crew and arrival window shortly.\n\nTrack status, photos and invoices: ${link}\n\n— Shoal Creek Clean`, "booking");
  return { ok: true, date: day, portalLink: process.env.ALPHA_MODE === "true" ? link : undefined };
});
