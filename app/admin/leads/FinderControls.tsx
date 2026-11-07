"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { SEGMENT_LABEL, SEGMENTS } from "@/lib/format";
import { cx } from "@/components/ui";

const FINDER_SEGMENTS = ["property_management", "multifamily", "retail_center", "restaurant", "office_park", "storefront"];
export function FinderControls() {
  const r = useRouter();
  const [sel, setSel] = useState<string[]>(FINDER_SEGMENTS);
  const [competitor, setCompetitor] = useState(true);
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FINDER_SEGMENTS.map((s) => (
          <button key={s} type="button" onClick={() => setSel(sel.includes(s) ? sel.filter((x) => x !== s) : [...sel, s])}
            className={cx("chip normal-case tracking-normal", sel.includes(s) ? "border-accent text-accent" : "border-white/10 text-slate-500")}>{SEGMENT_LABEL[s]}</button>
        ))}
        <button type="button" onClick={() => setCompetitor(!competitor)} className={cx("chip normal-case tracking-normal", competitor ? "border-accent-2 text-accent-2" : "border-white/10 text-slate-500")}>Competitor clients</button>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary btn-sm" onClick={async () => { try { const d = await api("/api/admin/finder", { segments: sel, competitor }); setMsg(`Queued ${d.queued} discovery jobs. Results appear over the next runs (every 10 minutes).`); r.refresh(); } catch (e: any) { setMsg(e.message); } }}>
          Run discovery
        </button>
        {msg && <span className="text-xs text-accent-2">{msg}</span>}
      </div>
      <p className="text-xs text-slate-500">Each run looks up named Austin-area businesses in the chosen segments, reads their own websites for published contacts, scores fit and writes a call/email brief.</p>
    </div>
  );
}

const COMPETITORS = ["Hi-Tech Power Wash", "ATX Clean Pressure Washing", "ATX Soft Wash", "Clean Green Power Washing", "Bright Brothers", "Georgetown Texas Power Wash", "Other / unknown"];
export function SightingForm() {
  const r = useRouter();
  const [f, setF] = useState({ company: "", address: "", city: "Austin", segment: "retail_center", competitor: COMPETITORS[0], notes: "" });
  const [msg, setMsg] = useState("");
  return (
    <form className="grid gap-3 sm:grid-cols-3" onSubmit={async (e) => { e.preventDefault(); try { const d = await api("/api/admin/leads/sighting", f); r.push(`/admin/leads/${d.id}`); } catch (x: any) { setMsg(x.message); } }}>
      <input className="input" placeholder="Business / property name" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
      <input className="input" placeholder="Address (optional)" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      <select className="input" value={f.competitor} onChange={(e) => setF({ ...f, competitor: e.target.value })}>{COMPETITORS.map((c) => <option key={c}>{c}</option>)}</select>
      <select className="input" value={f.segment} onChange={(e) => setF({ ...f, segment: e.target.value })}>{SEGMENTS.map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}</select>
      <input className="input" placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
      <div className="flex items-center gap-2"><button className="btn-primary btn-sm">Log sighting</button>{msg && <span className="text-xs text-rose-400">{msg}</span>}</div>
      <input className="input sm:col-span-3" placeholder="What you saw (truck, yard sign, crew working the lot…)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
    </form>
  );
}
