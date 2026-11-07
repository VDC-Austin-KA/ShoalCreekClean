"use client";
import { useState } from "react";
import { api } from "@/lib/client-fetch";
import type { Rule } from "@/lib/pricing";

export function RuleRow({ rule }: { rule: Rule }) {
  const [f, setF] = useState({ rate: rule.rate, min: rule.min_cents / 100, prod: rule.production_per_hour });
  const [state, setState] = useState("");
  const dirty = f.rate !== rule.rate || f.min !== rule.min_cents / 100 || f.prod !== rule.production_per_hour;
  const n = (k: keyof typeof f, step: string) => <input type="number" step={step} className="input w-28 py-1.5" value={f[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} />;
  return (
    <tr>
      <td className="py-2.5 pr-3"><div className="text-slate-200">{rule.label}</div><div className="text-xs text-slate-500">per {rule.unit}</div></td>
      <td>{n("rate", "0.01")}</td><td>{n("min", "5")}</td><td>{n("prod", "10")}</td><td className="text-slate-400">{rule.phase}</td>
      <td className="text-right">
        <button className="btn-ghost btn-sm" disabled={!dirty} onClick={async () => { try { await api("/api/pricing", { service: rule.service, rate: f.rate, min_cents: f.min * 100, production_per_hour: f.prod }, "PATCH"); setState("Saved ✓"); } catch (e: any) { setState(e.message); } }}>Save</button>
        {state && <span className="ml-2 text-xs text-accent-2">{state}</span>}
      </td>
    </tr>
  );
}
