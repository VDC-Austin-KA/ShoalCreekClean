import "server-only";
import { q } from "./db";
import { ctDate, ctTimeLabel } from "./tz";
export { addDays, weekStart, ctDate as todayCT } from "./tz";

// Shared admin queries.
export const crewsQ = () => q("SELECT id,name,color,size,equipment,home_lat,home_lng FROM crews ORDER BY name");
export const JOB_COLS = `j.id,j.title,j.service,j.address,j.lat,j.lng,j.status,j.crew_id,j.crew_size,j.equipment,j.quoted_minutes,j.actual_minutes,j.price_cents,j.frequency,j.scheduled_start,
  COALESCE(c.company, c.contact_name) AS client`;
/** Adds Central-time `day` (YYYY-MM-DD) and `time` ("8:00 am") labels from scheduled_start. */
export const withDay = <T extends { scheduled_start: string | null }>(rows: T[]) =>
  rows.map((r) => ({ ...r, day: r.scheduled_start ? ctDate(r.scheduled_start) : null, time: ctTimeLabel(r.scheduled_start) }));
