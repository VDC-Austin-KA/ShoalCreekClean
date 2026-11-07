import "server-only";
import { q } from "./db";
import { allocate, optimizeRoute, routeSummary } from "./geo";

/** Builds an allocation proposal for one Central-time day. */
export async function buildPlan(day: string) {
  const [crews, jobs, [acc]] = await Promise.all([
    q(`SELECT c.id,c.name,c.color,c.size,c.equipment,c.home_lat,c.home_lng,
         COALESCE((SELECT SUM(quoted_minutes) FROM jobs j WHERE j.crew_id=c.id AND j.status<>'cancelled' AND (j.scheduled_start AT TIME ZONE 'America/Chicago')::date=$1::date),0)::int AS booked_minutes
       FROM crews c ORDER BY name`, [day]),
    q(`SELECT j.id,j.title,j.lat,j.lng,j.quoted_minutes,j.crew_size,j.equipment,j.service,j.crew_id, COALESCE(c.company,c.contact_name) AS client
       FROM jobs j JOIN clients c ON c.id=j.client_id
       WHERE j.status='scheduled' AND (j.scheduled_start AT TIME ZONE 'America/Chicago')::date=$1::date ORDER BY j.quoted_minutes DESC`, [day]),
    q(`SELECT COALESCE(AVG(actual_minutes::float / NULLIF(quoted_minutes,0)),1) AS ratio, COUNT(*)::int AS n FROM jobs WHERE status='completed' AND actual_minutes IS NOT NULL`),
  ]);
  const ratio = Math.min(1.5, Math.max(0.7, Number(acc.ratio)));
  const unassigned = jobs.filter((j) => !j.crew_id);
  const assignments = allocate(unassigned, crews, ratio);
  // Route preview per crew: existing + proposed jobs, optimized from crew home base.
  const routes = crews.map((c) => {
    const stops = jobs.filter((j) => j.crew_id === c.id || assignments.some((a) => a.job_id === j.id && a.crew_id === c.id));
    const home = { lat: c.home_lat, lng: c.home_lng };
    const order = optimizeRoute(home, stops);
    const ordered = order.map((i) => stops[i]);
    const sum = routeSummary(home, ordered);
    const work = ordered.reduce((s, j) => s + Math.round(j.quoted_minutes * ratio), 0);
    return { crew: c, stops: ordered.map((j) => ({ id: j.id, title: j.title, client: j.client })), ...sum, workMinutes: work, utilization: Math.round(((work + sum.minutes) / 540) * 100) };
  });
  return { day, ratio, history: acc.n as number, crews, jobs, assignments, routes };
}
