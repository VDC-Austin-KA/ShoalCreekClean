import "server-only";
import { q } from "./db";

/** Contacts from clients + active leads with an email, minus the do-not-contact list, deduped (client record wins). */
export async function audience(aud: string) {
  const rows = await q<{ email: string; name: string; company: string | null; city: string | null; address: string | null; segment: string; pri: number }>(
    `SELECT email, name, company, city, address, segment, pri FROM (
       SELECT email, contact_name AS name, company, NULL AS city, address, segment, 0 AS pri FROM clients
       UNION ALL SELECT email, name, company, city, NULL, segment, 1 FROM leads WHERE stage <> 'lost')
     WHERE email IS NOT NULL AND email <> '' AND lower(email) NOT IN (SELECT contact FROM suppressions)
       AND (($1 = 'all') OR ($1 = 'commercial' AND segment <> 'residential') OR ($1 = 'residential' AND segment = 'residential') OR segment = $1)
     ORDER BY email, pri`, [aud]);
  const seen = new Set<string>();
  return rows
    .filter((r) => !seen.has(r.email) && seen.add(r.email))
    .map((r) => ({ email: r.email, name: r.name, company: r.company, segment: r.segment, city: r.city ?? r.address?.split(", ")[1] ?? null }));
}
