import { one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

/** Dispatch edits: crew, day (keeps time-of-day), time, status. */
export const PATCH = route(async (req, { params }) => {
  await requireApi(STAFF);
  const b = await req.json();
  const id = (await params).id;
  const sets: string[] = [], vals: unknown[] = [id];
  const p = (v: unknown) => (vals.push(v), `$${vals.length}`);
  if ("crew_id" in b) sets.push(`crew_id = ${p(b.crew_id || null)}`);
  if (b.day && /^\d{4}-\d{2}-\d{2}$/.test(b.day))
    sets.push(`scheduled_start = (${p(b.day)}::date + COALESCE((scheduled_start AT TIME ZONE 'America/Chicago')::time, time '08:00')) AT TIME ZONE 'America/Chicago'`);
  if (b.time && /^\d{2}:\d{2}$/.test(b.time))
    sets.push(`scheduled_start = ((COALESCE(scheduled_start, now()) AT TIME ZONE 'America/Chicago')::date + ${p(b.time)}::time) AT TIME ZONE 'America/Chicago'`);
  if (b.status && ["scheduled", "en_route", "in_progress", "completed", "cancelled"].includes(b.status)) sets.push(`status = ${p(b.status)}::job_status`);
  if (!sets.length) throw bad("Nothing to update");
  const j = await one(`UPDATE jobs SET ${sets.join(", ")} WHERE id=$1 RETURNING id`, vals);
  if (!j) throw bad("Job not found");
  return { ok: true };
});
