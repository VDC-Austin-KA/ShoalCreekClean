import "server-only";
import { q } from "./db";

/** Contacts from clients + active leads, deduped by email, filtered by audience. */
export async function audience(aud: string) {
  const rows = await q(
    `SELECT DISTINCT ON (email) email, name, company, city, segment FROM (
       SELECT email, contact_name AS name, company, split_part(address, ', ', 2) AS city, segment, 0 AS pri FROM clients
       UNION ALL SELECT email, name, company, city, segment, 1 FROM leads WHERE stage <> 'lost') t
     WHERE ($1 = 'all') OR ($1 = 'commercial' AND segment <> 'residential') OR ($1 = 'residential' AND segment = 'residential') OR segment = $1
     ORDER BY email, pri`, [aud]);
  return rows as { email: string; name: string; company: string | null; city: string | null; segment: string }[];
}
