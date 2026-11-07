"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { inPolygon } from "@/lib/geo";
import { usd } from "@/lib/format";
import { cx } from "@/components/ui";

const STATUS_DOT: Record<string, string> = { scheduled: "bg-slate-400", en_route: "bg-amber-400 animate-pulse", in_progress: "bg-accent animate-pulse", completed: "bg-lime-400", cancelled: "bg-rose-400" };

type Job = { id: string; title: string; client: string; status: string; crew_id: string | null; day: string | null; time: string | null; quoted_minutes: number; crew_size: number; price_cents: number; lat: number; lng: number; service: string };
type Crew = { id: string; name: string; color: string; size: number };
type Zone = { id: string; name: string; color: string; polygon: number[][] };

export function DispatchBoard({ days, crews, jobs: initial, zones, clients }: { days: string[]; crews: Crew[]; jobs: Job[]; zones: Zone[]; clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initial);
  const [group, setGroup] = useState<"crew" | "zone">("crew");
  const [drag, setDrag] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [showNew, setShowNew] = useState(false);

  const zoneOf = useMemo(() => (j: Job) => zones.find((z) => inPolygon(j, z.polygon))?.id ?? "other", [zones]);
  const rows = group === "crew"
    ? [...crews.map((c) => ({ id: c.id, name: c.name, color: c.color, sub: `${c.size} techs` })), { id: "none", name: "Unassigned", color: "#64748b", sub: "drag to a crew" }]
    : [...zones.map((z) => ({ id: z.id, name: z.name, color: z.color, sub: "route zone" })), { id: "other", name: "Outside zones", color: "#64748b", sub: "" }];
  const rowOf = (j: Job) => (group === "crew" ? j.crew_id ?? "none" : zoneOf(j));
  const unscheduled = jobs.filter((j) => !j.day);
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  async function move(id: string, rowId: string, day: string) {
    const prev = jobs;
    const patch: Record<string, unknown> = { day };
    if (group === "crew") patch.crew_id = rowId === "none" ? null : rowId;
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, day, ...(group === "crew" ? { crew_id: patch.crew_id as string | null } : {}) } : j)));
    setSelected(null); setErr("");
    try { await api(`/api/admin/jobs/${id}`, patch, "PATCH"); } catch (e: any) { setJobs(prev); setErr(e.message); }
  }
  const load = (rowId: string, day: string) => jobs.filter((j) => j.day === day && rowOf(j) === rowId).reduce((s, j) => s + j.quoted_minutes, 0);

  const card = (j: Job) => (
    <div key={j.id} draggable onDragStart={() => setDrag(j.id)} onDragEnd={() => { setDrag(null); setOver(null); }}
      onClick={(e) => { e.stopPropagation(); setSelected(selected === j.id ? null : j.id); }}
      className={cx("group cursor-grab rounded-lg border bg-ink-800/90 p-2 text-[11px] leading-tight transition-all duration-300 ease-(--ease-spring) hover:-translate-y-0.5 hover:border-accent/40 active:cursor-grabbing",
        drag === j.id ? "scale-95 opacity-40" : "", selected === j.id ? "border-accent ring-2 ring-accent/30" : "border-white/10")}>
      <div className="flex items-center justify-between gap-1"><span className="font-semibold text-slate-200">{j.time ?? "—"}</span><span title={j.status.replace("_", " ")} className={cx("size-2 shrink-0 rounded-full", STATUS_DOT[j.status])} /></div>
      <div className="mt-1 line-clamp-2 text-slate-300">{j.title}</div>
      <div className="mt-1 truncate text-slate-500">{j.client}</div>
      <div className="mt-1 flex justify-between text-slate-500"><span>{Math.round(j.quoted_minutes / 6) / 10}h · {j.crew_size}p</span><span>{usd(j.price_cents)}</span></div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid grid-cols-2 rounded-xl bg-ink-900 p-1 text-xs">
          {(["crew", "zone"] as const).map((g) => <button key={g} onClick={() => setGroup(g)} className={cx("rounded-lg px-4 py-1.5 capitalize transition", group === g ? "bg-white/10 text-white" : "text-slate-500")}>By {g === "zone" ? "route zone" : "crew"}</button>)}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowNew(!showNew)}>+ New job</button>
        {selected && <span className="text-xs text-accent">Tap a cell to move the selected job</span>}
        {err && <span className="text-xs text-rose-400">{err}</span>}
      </div>
      {showNew && <NewJob clients={clients} crews={crews} onDone={() => { setShowNew(false); router.refresh(); }} />}
      {unscheduled.length > 0 && (
        <div className="glass p-3"><div className="mb-2 text-xs uppercase tracking-wider text-slate-400">Unscheduled backlog</div><div className="flex flex-wrap gap-2">{unscheduled.map((j) => <div key={j.id} className="w-44">{card(j)}</div>)}</div></div>
      )}
      <div className="glass overflow-x-auto p-0">
        <div className="grid min-w-[1100px]" style={{ gridTemplateColumns: `170px repeat(7, minmax(130px, 1fr))` }}>
          <div className="sticky left-0 z-10 border-b border-white/5 bg-ink-900/95 p-3" />
          {days.map((d) => (
            <div key={d} className={cx("border-b border-l border-white/5 p-3 text-xs", d === today ? "text-accent" : "text-slate-400")}>
              <div className="font-semibold uppercase tracking-wider">{new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}</div>
              <div>{new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</div>
            </div>
          ))}
          {rows.map((r) => (
            <div key={r.id} className="contents">
              <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-white/5 bg-ink-900/95 p-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: r.color }} />
                <div className="min-w-0"><div className="truncate text-sm font-medium text-slate-200">{r.name}</div><div className="text-[11px] text-slate-500">{r.sub}</div></div>
              </div>
              {days.map((d) => {
                const key = r.id + d, mins = load(r.id, d);
                return (
                  <div key={key}
                    onDragOver={(e) => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver(null)}
                    onDrop={() => { if (drag) move(drag, r.id, d); setOver(null); }}
                    onClick={() => selected && move(selected, r.id, d)}
                    className={cx("min-h-28 space-y-1.5 border-b border-l border-white/5 p-1.5 transition-colors duration-200", over === key && "bg-accent/10", selected && "cursor-pointer hover:bg-accent/5", d === today && "bg-white/[0.015]")}>
                    {jobs.filter((j) => j.day === d && rowOf(j) === r.id).map(card)}
                    {group === "crew" && mins > 0 && (
                      <div className="h-1 overflow-hidden rounded-full bg-white/5" title={`${Math.round(mins / 6) / 10}h of 9h`}>
                        <div className={cx("h-full rounded-full", mins > 540 ? "bg-rose-400" : "bg-accent/60")} style={{ width: `${Math.min(100, (mins / 540) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewJob({ clients, crews, onDone }: { clients: { id: string; name: string }[]; crews: Crew[]; onDone: () => void }) {
  const [f, setF] = useState({ client_id: clients[0]?.id ?? "", title: "", service: "flatwork", date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }), time: "08:00", minutes: 120, crew_size: 2, price: 500, crew_id: "" });
  const [err, setErr] = useState("");
  const inp = (k: keyof typeof f, type = "text") => <input className="input" type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: type === "number" ? +e.target.value : e.target.value })} />;
  return (
    <form className="glass grid gap-3 p-4 animate-rise sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/admin/jobs", f); onDone(); } catch (x: any) { setErr(x.message); } }}>
      <div className="sm:col-span-2"><label className="label">Client</label><select className="input" value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="sm:col-span-2"><label className="label">Title</label>{inp("title")}</div>
      <div><label className="label">Date</label>{inp("date", "date")}</div>
      <div><label className="label">Start</label>{inp("time", "time")}</div>
      <div><label className="label">Minutes</label>{inp("minutes", "number")}</div>
      <div><label className="label">Price $</label>{inp("price", "number")}</div>
      <div><label className="label">Crew</label><select className="input" value={f.crew_id} onChange={(e) => setF({ ...f, crew_id: e.target.value })}><option value="">Unassigned</option>{crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div><label className="label">Techs needed</label>{inp("crew_size", "number")}</div>
      <div className="flex items-end gap-2 sm:col-span-2"><button className="btn-primary">Create job</button>{err && <span className="text-xs text-rose-400">{err}</span>}</div>
    </form>
  );
}
