import "server-only";
import { one } from "./db";
import { requireApi, HttpError } from "./auth";
import { STAFF } from "./session";

/** Crew can act only on jobs assigned to a crew they belong to; partners on any job. */
export async function jobForField(id: string) {
  const s = await requireApi(["crew", ...STAFF]);
  const job = await one(
    `SELECT j.*, c.email AS client_email, c.contact_name FROM jobs j JOIN clients c ON c.id=j.client_id
     WHERE j.id=$1 AND ($2 OR EXISTS (SELECT 1 FROM crew_members m WHERE m.crew_id=j.crew_id AND m.user_id=$3))`,
    [id, STAFF.includes(s.role), s.uid]);
  if (!job) throw new HttpError(404, "Job not found");
  return { s, job };
}
