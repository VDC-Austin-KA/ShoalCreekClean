import Link from "next/link";
import { q } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { todayCT, addDays, withDay } from "@/lib/admin";
import { ctDayBounds } from "@/lib/tz";
import { Empty, Logo } from "@/components/ui";
import { FieldJob } from "./FieldJob";

export const dynamic = "force-dynamic";
export default async function Field({ searchParams }: { searchParams: Promise<{ day?: string; crew?: string }> }) {
  const s = await requirePage(["crew", ...STAFF]);
  const sp = await searchParams;
  const day = sp.day && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : todayCT();
  const staff = STAFF.includes(s.role);
  const crews = staff ? await q("SELECT id,name,color FROM crews ORDER BY name")
    : await q("SELECT c.id,c.name,c.color FROM crews c JOIN crew_members m ON m.crew_id=c.id WHERE m.user_id=$1", [s.uid]);
  const crew = crews.find((c) => c.id === sp.crew) ?? crews[0];
  const [from, to] = ctDayBounds(day);
  const jobs = crew ? withDay(await q(
    `SELECT j.id,j.title,j.address,j.lat,j.lng,j.status,j.notes,j.crew_size,j.equipment,j.quoted_minutes,j.clock_in,j.scheduled_start,
       COALESCE(c.company,c.contact_name) AS client, c.phone,
       (SELECT json_group_array(json_object('id',p.id,'kind',p.kind,'url',p.data_url)) FROM job_photos p WHERE p.job_id=j.id) AS photos
     FROM jobs j JOIN clients c ON c.id=j.client_id
     WHERE j.crew_id=$1 AND j.status<>'cancelled' AND j.scheduled_start >= $2 AND j.scheduled_start < $3
     ORDER BY j.route_order IS NULL, j.route_order, j.scheduled_start`, [crew.id, from, to])) : [];
  const route = jobs.filter((j) => j.status !== "completed");
  const mapsAll = route.length ? `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${route.at(-1)!.lat},${route.at(-1)!.lng}${route.length > 1 ? `&waypoints=${route.slice(0, -1).map((j) => `${j.lat},${j.lng}`).join("|")}` : ""}` : null;
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ day, ...(crew ? { crew: crew.id } : {}), ...o });
  return (
    <div className="mx-auto max-w-lg px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between border-b border-white/5 bg-ink-950/85 px-4 py-3 backdrop-blur-xl">
        <Logo href={staff ? "/admin" : "/field"} />
        <form action="/api/auth/logout" method="post"><button className="text-xs text-slate-400">Sign out</button></form>
      </header>
      <div className="mt-5 flex items-center justify-between">
        <Link href={qs({ day: addDays(day, -1) })} className="btn-ghost btn-sm">←</Link>
        <div className="text-center"><div className="text-lg font-semibold text-white">{new Date(day + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}</div><div className="text-xs text-slate-500">{crew?.name ?? "No crew"} · {jobs.length} stops</div></div>
        <Link href={qs({ day: addDays(day, 1) })} className="btn-ghost btn-sm">→</Link>
      </div>
      {staff && crews.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">{crews.map((c) => <Link key={c.id} href={qs({ crew: c.id })} className={`chip shrink-0 ${c.id === crew?.id ? "border-accent text-accent" : "border-white/10 text-slate-400"}`}>{c.name}</Link>)}</div>
      )}
      {mapsAll && <a href={mapsAll} target="_blank" className="btn-primary mt-4 w-full py-3">🧭 Start full route ({route.length} stops)</a>}
      <div className="mt-4 space-y-4">
        {jobs.length ? jobs.map((j, i) => <FieldJob key={j.id} job={j} n={i + 1} />) : <Empty>No assignments for this day.</Empty>}
      </div>
    </div>
  );
}
