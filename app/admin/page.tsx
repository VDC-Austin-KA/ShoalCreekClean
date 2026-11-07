import Link from "next/link";
import { q } from "@/lib/db";
import { JOB_COLS, todayCT, weekStart, withDay } from "@/lib/admin";
import { ctDayBounds, ctToUtc } from "@/lib/tz";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { dt, usd } from "@/lib/format";
import { ApproveQuote } from "./ApproveQuote";

export const dynamic = "force-dynamic";
export default async function Overview() {
  const today = todayCT();
  const [dayFrom, dayTo] = ctDayBounds(today);
  const [weekFrom, weekTo] = ctDayBounds(weekStart(today), 7);
  const monthFrom = ctToUtc(today.slice(0, 8) + "01", "00:00");
  const [[k], todays, reviews, leads] = await Promise.all([
    q(`SELECT
        (SELECT COALESCE(SUM(amount_cents),0) FROM invoices WHERE status='paid' AND paid_at >= $1) AS mtd,
        (SELECT COALESCE(SUM(amount_cents),0) FROM invoices WHERE status='open') AS ar,
        (SELECT COUNT(*) FROM jobs WHERE status<>'cancelled' AND scheduled_start >= $2 AND scheduled_start < $3) AS week_jobs,
        (SELECT COALESCE(SUM(value_cents),0) FROM leads WHERE stage IN ('new','contacted','quoted')) AS pipeline,
        (SELECT COUNT(*) FROM jobs WHERE crew_id IS NULL AND status='scheduled') AS unassigned,
        (SELECT CAST(ROUND(AVG(CAST(actual_minutes AS REAL)/NULLIF(quoted_minutes,0))*100) AS INTEGER) FROM jobs WHERE actual_minutes IS NOT NULL) AS accuracy`, [monthFrom, weekFrom, weekTo]),
    q(`SELECT ${JOB_COLS}, cr.name AS crew, cr.color FROM jobs j JOIN clients c ON c.id=j.client_id LEFT JOIN crews cr ON cr.id=j.crew_id
       WHERE j.scheduled_start >= $1 AND j.scheduled_start < $2 ORDER BY j.scheduled_start`, [dayFrom, dayTo]).then(withDay),
    q("SELECT id,total_cents,input,created_at FROM quotes WHERE status='review' ORDER BY created_at DESC")
      .then((rows) => rows.map((r) => ({ ...r, created: dt(r.created_at, { month: "short", day: "numeric" }) }))),
    q("SELECT id,name,company,stage,value_cents,source FROM leads ORDER BY created_at DESC LIMIT 6"),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Operations overview" sub={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" })}
        action={<div className="flex gap-2"><Link href="/admin/planner" className="btn-ghost">Plan tomorrow</Link><Link href="/admin/dispatch" className="btn-primary">Open dispatch</Link></div>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue (MTD)" value={usd(k.mtd)} sub="paid invoices" />
        <Stat label="Accounts receivable" value={usd(k.ar)} sub="open invoices" />
        <Stat label="Jobs this week" value={k.week_jobs} sub={<span className={k.unassigned ? "text-amber-300" : ""}>{k.unassigned} awaiting crew</span>} />
        <Stat label="Open pipeline" value={usd(k.pipeline)} sub={`quote accuracy ${k.accuracy ?? 100}% of quoted time`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Today's jobs" action={<Link href="/field" className="text-xs text-accent">Field view →</Link>}>
          {todays.length ? (
            <ul className="divide-y divide-white/5">
              {todays.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-16 shrink-0 text-xs text-slate-500">{j.time}</span>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: j.color ?? "#64748b" }} />
                    <div className="min-w-0"><div className="truncate text-slate-200">{j.title}</div><div className="truncate text-xs text-slate-500">{j.client} · {j.crew ?? "Unassigned"}</div></div>
                  </div>
                  <Badge status={j.status} />
                </li>
              ))}
            </ul>
          ) : <Empty>No jobs today.</Empty>}
        </Card>
        <div className="space-y-6">
          <Card title={`Quote review queue (${reviews.length})`}>
            {reviews.length ? (
              <ul className="space-y-3">{reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-white/5 bg-ink-900/50 p-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-200">{r.input.company || r.input.name}</span><span className="tabular-nums">{usd(r.total_cents)}</span></div>
                  <div className="text-xs text-slate-500">{r.input.city} · {r.input.stories}-story · {r.input.frequency.replace("_", " ")} · {r.created}</div>
                  <ApproveQuote id={r.id} total={r.total_cents / 100} />
                </li>))}</ul>
            ) : <Empty>Nothing to review.</Empty>}
          </Card>
          <Card title="Newest leads" action={<Link href="/admin/crm" className="text-xs text-accent">Pipeline →</Link>}>
            <ul className="space-y-2 text-sm">{leads.map((l) => <li key={l.id} className="flex justify-between gap-2"><span className="truncate text-slate-300">{l.company ?? l.name} <span className="text-xs text-slate-600">· {l.source}</span></span><span className="chip border-white/10 text-slate-400">{l.stage}</span></li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
