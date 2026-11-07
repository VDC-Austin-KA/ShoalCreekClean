import Link from "next/link";
import { q } from "@/lib/db";
import { crewsQ, JOB_COLS, weekStart, addDays, withDay } from "@/lib/admin";
import { ctDayBounds } from "@/lib/tz";
import { PageHeader } from "@/components/ui";
import { DispatchBoard } from "./DispatchBoard";

export const dynamic = "force-dynamic";
export default async function Dispatch({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const start = weekStart((await searchParams).week);
  const [from, to] = ctDayBounds(start, 7);
  const [crews, jobs, zones, clients] = await Promise.all([
    crewsQ(),
    q(`SELECT ${JOB_COLS} FROM jobs j JOIN clients c ON c.id=j.client_id
       WHERE j.status <> 'cancelled' AND ((j.scheduled_start >= $1 AND j.scheduled_start < $2) OR j.scheduled_start IS NULL)
       ORDER BY j.scheduled_start IS NULL, j.scheduled_start`, [from, to]).then(withDay),
    q("SELECT id,name,color,polygon FROM service_zones ORDER BY phase, name"),
    q("SELECT id, COALESCE(company, contact_name) AS name FROM clients ORDER BY 2"),
  ]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div>
      <PageHeader title="Master schedule & dispatch" sub="Drag jobs between crews and days. Changes save instantly."
        action={<div className="flex gap-2">
          <Link className="btn-ghost btn-sm" href={`?week=${addDays(start, -7)}`}>← Prev</Link>
          <Link className="btn-ghost btn-sm" href="?">This week</Link>
          <Link className="btn-ghost btn-sm" href={`?week=${addDays(start, 7)}`}>Next →</Link>
        </div>} />
      <DispatchBoard days={days} crews={crews} jobs={jobs} zones={zones} clients={clients} />
    </div>
  );
}
