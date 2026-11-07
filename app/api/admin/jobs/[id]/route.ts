import { one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { ctClock, ctDate, ctToUtc, isoClock, isoDay } from "@/lib/tz";

/** Dispatch edits: crew, day (keeps Central-time clock), time, status. */
export const PATCH = route(async (req, { params }) => {
  await requireApi(STAFF);
  const b = await req.json();
  const job = await one<{ id: string; scheduled_start: string | null }>("SELECT id, scheduled_start FROM jobs WHERE id=$1", [(await params).id]);
  if (!job) throw bad("Job not found");
  const sets: string[] = [], vals: unknown[] = [job.id];
  const p = (v: unknown) => (vals.push(v), `$${vals.length}`);
  if ("crew_id" in b) sets.push(`crew_id = ${p(b.crew_id || null)}`);
  const day = isoDay(b.day), time = isoClock(b.time);
  if (day || time) {
    const cur = job.scheduled_start;
    sets.push(`scheduled_start = ${p(ctToUtc(day ?? ctDate(cur ?? new Date()), time ?? (cur ? ctClock(cur) : "08:00")))}`);
  }
  if (["scheduled", "en_route", "in_progress", "completed", "cancelled"].includes(b.status)) sets.push(`status = ${p(b.status)}`);
  if (!sets.length) throw bad("Nothing to update");
  await one(`UPDATE jobs SET ${sets.join(", ")} WHERE id=$1 RETURNING id`, vals);
  return { ok: true };
});
