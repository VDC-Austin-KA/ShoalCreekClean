import { buildPlan } from "@/lib/planner";
import { todayCT, addDays } from "@/lib/admin";
import { Card, Empty, PageHeader, cx } from "@/components/ui";
import { ApplyPlan } from "./ApplyPlan";

export const dynamic = "force-dynamic";
export default async function Planner({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const sp = (await searchParams).day;
  const day = sp && /^\d{4}-\d{2}-\d{2}$/.test(sp) ? sp : addDays(todayCT(), 1);
  const plan = await buildPlan(day);
  const byId = new Map(plan.jobs.map((j) => [j.id, j]));
  const crewName = new Map(plan.crews.map((c) => [c.id, c.name]));
  return (
    <div className="space-y-6">
      <PageHeader title="Resource & labor allocation" sub="Matches crew size, equipment, capacity and drive time; durations are calibrated by quoted-vs-actual history."
        action={<form className="flex gap-2"><input type="date" name="day" defaultValue={day} className="input w-auto" /><button className="btn-ghost">Load</button></form>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Duration calibration"><div className="text-3xl font-semibold text-white">{plan.ratio.toFixed(2)}×</div><p className="mt-1 text-xs text-slate-500">actual ÷ quoted across {plan.history} completed jobs</p></Card>
        <Card title="Jobs on day"><div className="text-3xl font-semibold text-white">{plan.jobs.length}</div><p className="mt-1 text-xs text-slate-500">{plan.assignments.length} awaiting a crew</p></Card>
        <Card title="Plan"><ApplyPlan day={day} count={plan.assignments.filter((a) => a.crew_id).length} /></Card>
      </div>
      <Card title="Proposed assignments">
        {plan.assignments.length ? (
          <ul className="divide-y divide-ink-700">
            {plan.assignments.map((a) => {
              const j = byId.get(a.job_id)!;
              return (
                <li key={a.job_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div><div className="font-medium text-slate-200">{j.title}</div><div className="text-xs text-slate-500">{j.client} · {Math.round(j.quoted_minutes / 6) / 10}h · {j.crew_size} techs{j.equipment.length ? ` · ${j.equipment.join(", ")}` : ""}</div></div>
                  <div className="text-right"><div className={cx("font-semibold", a.crew_id ? "text-accent" : "text-rose-400")}>{a.crew_id ? `→ ${crewName.get(a.crew_id)}` : "Can't place"}</div><div className="max-w-sm text-xs text-slate-500">{a.reason}</div></div>
                </li>
              );
            })}
          </ul>
        ) : <Empty>No unassigned jobs on {day}. Pick another day or create jobs on the dispatch board.</Empty>}
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {plan.routes.map((r) => (
          <Card key={r.crew.id} title={<span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: r.crew.color }} />{r.crew.name}</span>}>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-800"><div className={cx("h-full rounded-full transition-all duration-700", r.utilization > 100 ? "bg-rose-400" : "bg-accent")} style={{ width: `${Math.min(100, r.utilization)}%` }} /></div>
            <div className="mb-3 text-xs text-slate-500">{r.utilization}% of 9h shift · {Math.round(r.workMinutes / 6) / 10}h work · {r.minutes} min / {r.km} km driving</div>
            <ol className="space-y-1.5 text-sm">{r.stops.map((s, i) => <li key={s.id} className="flex gap-2"><span className="text-slate-600">{i + 1}.</span><span className="truncate text-slate-300">{s.title}</span></li>)}</ol>
            {!r.stops.length && <p className="text-xs text-slate-600">No stops</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
