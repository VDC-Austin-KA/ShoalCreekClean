"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { usd, SEGMENTS, SEGMENT_LABEL } from "@/lib/format";
import { CITIES } from "@/lib/content";
import { cx } from "@/components/ui";

type Lead = { id: string; name: string; company: string | null; email: string; segment: string; city: string; stage: string; value_cents: number; source: string; notes: string | null; updated: string };
const STAGES = [["new", "New lead", "#94a3b8"], ["contacted", "Contacted", "#fbbf24"], ["quoted", "Quoted", "#22d3ee"], ["won", "Won", "#a3e635"], ["retained", "Retained", "#34d399"], ["lost", "Lost", "#fb7185"]] as const;

export function Pipeline({ leads: init }: { leads: Lead[] }) {
  const router = useRouter();
  const [leads, setLeads] = useState(init);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function move(id: string, stage: string) {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
    setSelected(null);
    try { await api(`/api/admin/leads/${id}`, { stage }, "PATCH"); } catch { setLeads(prev); }
  }
  return (
    <div className="space-y-4">
      <button className="btn-primary btn-sm" onClick={() => setAdding(!adding)}>+ Add lead</button>
      {adding && <AddLead onDone={() => { setAdding(false); router.refresh(); }} />}
      <div className="grid auto-cols-[minmax(230px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-4">
        {STAGES.map(([key, label, color]) => {
          const col = leads.filter((l) => l.stage === key);
          return (
            <div key={key} onDragOver={(e) => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver(null)} onDrop={() => { if (drag) move(drag, key); setOver(null); }}
              onClick={() => selected && move(selected, key)}
              className={cx("glass min-h-96 p-3 transition-colors duration-200", over === key && "border-accent/40 bg-accent/5")}>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300"><span className="size-2 rounded-full" style={{ background: color }} />{label}</span>
                <span className="text-xs text-slate-500">{col.length} · {usd(col.reduce((s, l) => s + l.value_cents, 0))}</span>
              </div>
              <div className="space-y-2">
                {col.map((l) => (
                  <div key={l.id} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)} onClick={(e) => { e.stopPropagation(); setSelected(selected === l.id ? null : l.id); }}
                    className={cx("cursor-grab rounded-xl border bg-ink-800/90 p-3 text-sm transition-all duration-300 ease-(--ease-spring) hover:-translate-y-0.5", drag === l.id && "opacity-40", selected === l.id ? "border-accent" : "border-white/10")}>
                    <div className="font-medium text-slate-100">{l.company ?? l.name}</div>
                    <div className="text-xs text-slate-500">{l.name} · {l.city}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="chip border-white/10 text-slate-400">{SEGMENT_LABEL[l.segment] ?? l.segment}</span>
                      <span className="font-semibold tabular-nums text-slate-200">{usd(l.value_cents)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-600"><span>{l.source} · {l.updated}</span><a href={`/admin/leads/${l.id}`} draggable={false} onClick={(e) => e.stopPropagation()} className="text-accent hover:underline">Brief →</a></div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddLead({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", company: "", email: "", phone: "", segment: "property_management", city: "Austin", value: 1000, source: "manual" });
  const [err, setErr] = useState("");
  return (
    <form className="glass grid gap-3 p-4 animate-rise sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/admin/leads", f); onDone(); } catch (x: any) { setErr(x.message); } }}>
      {(["name", "company", "email", "phone"] as const).map((k) => <div key={k}><label className="label">{k}</label><input className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>)}
      <div><label className="label">Segment</label><select className="input" value={f.segment} onChange={(e) => setF({ ...f, segment: e.target.value })}>{SEGMENTS.map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}</select></div>
      <div><label className="label">City</label><select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label">Est. annual value $</label><input type="number" className="input" value={f.value} onChange={(e) => setF({ ...f, value: +e.target.value })} /></div>
      <div className="flex items-end gap-2"><button className="btn-primary">Save lead</button>{err && <span className="text-xs text-rose-400">{err}</span>}</div>
    </form>
  );
}
