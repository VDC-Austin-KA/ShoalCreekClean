import Link from "next/link";
import { q } from "@/lib/db";
import { clientForPage } from "@/lib/clientctx";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { StatusTracker } from "@/components/StatusTracker";
import { AutoRefresh } from "@/components/AutoRefresh";
import { dt, usd, FREQ_LABEL } from "@/lib/format";
import { JobActions } from "./JobActions";

export const dynamic = "force-dynamic";
export default async function ClientHome() {
  const { s, c } = await clientForPage();
  if (!c) return <Empty>No client profile is linked to {s.email} yet. <Link className="text-accent" href="/quote">Request a quote</Link>.</Empty>;
  const jobs = await q(
    `SELECT j.*, cr.name AS crew_name,
       (SELECT json_group_array(json_object('kind',p.kind,'url',p.data_url,'at',p.created_at))
          FROM (SELECT * FROM job_photos WHERE job_id=j.id ORDER BY created_at) p) AS photos
     FROM jobs j LEFT JOIN crews cr ON cr.id=j.crew_id WHERE j.client_id=$1 ORDER BY j.scheduled_start IS NOT NULL, j.scheduled_start DESC`, [c.id]);
  const upcoming = jobs.filter((j) => j.status !== "completed" && j.status !== "cancelled").reverse();
  const history = jobs.filter((j) => j.status === "completed");
  const [{ open }] = await q("SELECT COALESCE(SUM(amount_cents),0) AS open FROM invoices WHERE client_id=$1 AND status='open'", [c.id]);

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />
      <PageHeader title={`Welcome, ${c.contact_name.split(" ")[0]}`} sub={c.company ?? c.address} action={<Link href="/quote" className="btn-primary">Request new service</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Upcoming" value={upcoming.length} sub={upcoming[0] ? `Next: ${dt(upcoming[0].scheduled_start)}` : "Nothing scheduled"} />
        <Stat label="Completed jobs" value={history.length} />
        <Stat label="Balance due" value={usd(open)} sub={<Link href="/client/billing" className="text-accent">View invoices →</Link>} />
      </div>

      <Card title="Upcoming & live" action={<span className="flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-lime-400" />Live</span>}>
        {upcoming.length ? (
          <div className="space-y-4">
            {upcoming.map((j) => (
              <div key={j.id} className="rounded-xl border border-ink-700 bg-ink-900/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{j.title}</div>
                    <div className="text-xs text-slate-500">{dt(j.scheduled_start)} · {j.crew_name ?? "Crew being assigned"} · {FREQ_LABEL[j.frequency]}</div>
                  </div>
                  <Badge status={j.status} />
                </div>
                <div className="mt-4"><StatusTracker status={j.status} /></div>
                <JobActions id={j.id} frequency={j.frequency} />
              </div>
            ))}
          </div>
        ) : <Empty>No upcoming services.</Empty>}
      </Card>

      <Card title="Job history & photo proof">
        {history.length ? (
          <div className="space-y-4">
            {history.map((j) => (
              <div key={j.id} className="grid gap-4 rounded-xl border border-ink-700 bg-ink-900/50 p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex items-center gap-2 font-medium text-white">{j.title} <Badge status="completed" /></div>
                  <div className="text-xs text-slate-500">{dt(j.clock_out ?? j.scheduled_start)} · {usd(j.price_cents)}</div>
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {j.photos.map((p: any, i: number) => (
                      <a key={i} href={p.url} target="_blank" className="relative block shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.kind} className="h-24 w-36 rounded-lg object-cover transition-opacity hover:opacity-90" />
                        <span className="chip absolute bottom-1 left-1 border-ink-600 bg-ink-950/75 text-white">{p.kind}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <JobActions id={j.id} frequency={j.frequency} rebookOnly />
              </div>
            ))}
          </div>
        ) : <Empty>No completed jobs yet.</Empty>}
      </Card>
    </div>
  );
}
