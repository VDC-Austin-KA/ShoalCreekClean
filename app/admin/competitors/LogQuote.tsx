"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { CITIES } from "@/lib/content";

const SERVICES = ["flatwork", "parking_garage", "dumpster_pad", "storefront", "building_wash", "softwash_house", "roof", "gutter", "driveway", "sealing"];
export function LogQuote() {
  const r = useRouter();
  const [f, setF] = useState({ competitor: "", service: "flatwork", quantity: "", unit: "sqft", amount: "", city: "Austin", source: "partner", notes: "" });
  const [msg, setMsg] = useState("");
  return (
    <form className="grid gap-3 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/admin/market-quotes", f); setMsg("Logged ✓"); r.refresh(); } catch (x: any) { setMsg(x.message); } }}>
      <input className="input" placeholder="Competitor" value={f.competitor} onChange={(e) => setF({ ...f, competitor: e.target.value })} />
      <select className="input" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
      <div className="flex gap-2"><input className="input" placeholder="Qty" inputMode="numeric" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /><select className="input w-24" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}><option>sqft</option><option>lf</option></select></div>
      <input className="input" placeholder="Quoted $" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      <select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
      <select className="input" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="partner">Partner-obtained</option><option value="prospect">Shared by prospect/client</option><option value="public">Public listing</option></select>
      <input className="input sm:col-span-2" placeholder="Notes (scope, date, how obtained)" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      <div className="flex items-center gap-3"><button className="btn-primary btn-sm">Log quote</button>{msg && <span className="text-xs text-accent-2">{msg}</span>}</div>
    </form>
  );
}
