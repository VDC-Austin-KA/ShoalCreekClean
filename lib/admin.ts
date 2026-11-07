import "server-only";
import { q } from "./db";
// Shared admin queries.
export const crewsQ = () => q("SELECT id,name,color,size,equipment,home_lat,home_lng FROM crews ORDER BY name");
export const JOB_COLS = `j.id,j.title,j.service,j.address,j.lat,j.lng,j.status,j.crew_id,j.crew_size,j.equipment,j.quoted_minutes,j.actual_minutes,j.price_cents,j.frequency,j.scheduled_start,
  to_char(j.scheduled_start AT TIME ZONE 'America/Chicago','YYYY-MM-DD') AS day, to_char(j.scheduled_start AT TIME ZONE 'America/Chicago','FMHH12:MI am') AS time,
  COALESCE(c.company, c.contact_name) AS client`;
export function weekStart(iso?: string) {
  const d = new Date((iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : todayCT()) + "T12:00:00Z");
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
export const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const todayCT = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
