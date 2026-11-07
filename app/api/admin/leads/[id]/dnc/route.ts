import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

/** Do Not Contact: suppress the lead and every email/phone we know for it, and close it out in the CRM. */
export const POST = route(async (_req, { params }) => {
  await requireApi(STAFF);
  const id = (await params).id;
  const lead = await one("SELECT l.id, l.email, l.phone, i.emails, i.phones FROM leads l LEFT JOIN lead_intel i ON i.lead_id=l.id WHERE l.id=$1", [id]);
  if (!lead) throw bad("Lead not found");
  const contacts = new Set<string>([`lead:${id}`]);
  if (lead.email) contacts.add(lead.email.toLowerCase());
  if (lead.phone) contacts.add(lead.phone);
  for (const e of lead.emails ?? []) contacts.add(e.value.toLowerCase());
  for (const p of lead.phones ?? []) contacts.add(p.value);
  await q("INSERT INTO suppressions (contact, reason) SELECT value, 'do not contact' FROM json_each($1) WHERE true ON CONFLICT (contact) DO NOTHING", [[...contacts]]);
  await q("UPDATE leads SET stage='lost', notes=COALESCE(notes || ' · ', '') || 'DO NOT CONTACT', updated_at=now() WHERE id=$1", [id]);
  return { ok: true, suppressed: contacts.size };
});
