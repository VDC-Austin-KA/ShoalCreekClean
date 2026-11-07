import { one } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  const c = await one("SELECT * FROM clients WHERE id=$1", [b.client_id]);
  if (!c) throw bad("Choose a client");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : null;
  const time = /^\d{2}:\d{2}$/.test(b.time) ? b.time : "08:00";
  const j = await one(
    `INSERT INTO jobs (client_id,crew_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,crew_size,equipment,frequency,price_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7, CASE WHEN $8::date IS NULL THEN NULL ELSE ($8::date + $9::time) AT TIME ZONE 'America/Chicago' END,$10,$11,$12,$13,$14) RETURNING id`,
    [c.id, b.crew_id || null, str(b.title, 120) || "Service visit", str(b.service, 40) || "flatwork", c.address ?? "", c.lat ?? 30.2672, c.lng ?? -97.7431, day, time,
     Math.max(30, Math.min(960, Number(b.minutes) || 120)), Math.max(1, Math.min(6, Number(b.crew_size) || 2)), Array.isArray(b.equipment) ? b.equipment.map((e: unknown) => str(e, 40)) : [],
     str(b.frequency, 20) || "one_time", Math.round((Number(b.price) || 0) * 100)]);
  return { id: j!.id };
});
