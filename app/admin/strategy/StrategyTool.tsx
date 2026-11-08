"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { generateStrategy, type StrategyInput } from "@/lib/strategy";
import { SEGMENTS, SEGMENT_LABEL } from "@/lib/format";
import { CITIES } from "@/lib/content";
import { Card } from "@/components/ui";

export function StrategyTool() {
  const [i, setI] = useState<StrategyInput>({ segment: "property_management", size: "portfolio", city: "Austin", month: new Date().getMonth() + 1 });
  const s = useMemo(() => generateStrategy(i), [i]);
  const campaignHref = `/admin/campaigns?${new URLSearchParams({ name: s.headline, subject: s.email.subject, body: s.email.body, audience: i.segment })}`;
  return (
    <div className="space-y-6">
      <div className="glass grid gap-3 p-4 sm:grid-cols-4">
        <div><label className="label">Segment</label><select className="input" value={i.segment} onChange={(e) => setI({ ...i, segment: e.target.value })}>{SEGMENTS.map((x) => <option key={x} value={x}>{SEGMENT_LABEL[x]}</option>)}</select></div>
        <div><label className="label">Account size</label><select className="input" value={i.size} onChange={(e) => setI({ ...i, size: e.target.value as StrategyInput["size"] })}><option value="single">Single site</option><option value="small">2–5 sites</option><option value="portfolio">Portfolio (6+)</option></select></div>
        <div><label className="label">City</label><select className="input" value={i.city} onChange={(e) => setI({ ...i, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Month</label><select className="input" value={i.month} onChange={(e) => setI({ ...i, month: +e.target.value })}>{Array.from({ length: 12 }, (_, m) => <option key={m} value={m + 1}>{new Date(2026, m).toLocaleString("en-US", { month: "long" })}</option>)}</select></div>
      </div>
      <div key={JSON.stringify(i)} className="grid gap-4 lg:grid-cols-2">
        <Card title="Positioning" className="lg:col-span-2">
          <h3 className="text-xl font-semibold text-white">{s.headline}</h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="label">Decision maker</dt><dd className="text-slate-200">{s.decisionMaker}</dd></div>
            <div><dt className="label">Angle</dt><dd className="text-slate-200">{s.angle}</dd></div>
            <div><dt className="label">Offer</dt><dd className="text-accent-2">{s.offer}</dd></div>
          </dl>
        </Card>
        <Card title="Tactics"><ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">{s.tactics.map((t) => <li key={t}>{t}</li>)}</ul></Card>
        <Card title="17-day cadence"><ol className="space-y-2 text-sm">{s.cadence.map((c) => <li key={c.day} className="flex gap-3"><span className="chip h-fit border-accent/30 text-accent">Day {c.day}</span><span><b className="text-slate-200">{c.channel}:</b> <span className="text-slate-400">{c.action}</span></span></li>)}</ol></Card>
        <Card title="Email template" action={<Link href={campaignHref} className="btn-primary btn-sm">Use as campaign →</Link>}>
          <div className="text-sm font-semibold text-slate-200">{s.email.subject}</div>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-400">{s.email.body}</pre>
        </Card>
        <Card title="Call opener & objections">
          <p className="text-sm italic text-slate-300">“{s.callOpener}”</p>
          <ul className="mt-4 space-y-3 text-sm">{s.objections.map((o) => <li key={o.q}><div className="text-slate-200">{o.q}</div><div className="text-slate-500">→ {o.a}</div></li>)}</ul>
        </Card>
        <Card title="Pitch collateral" className="lg:col-span-2"><ul className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">{s.collateral.map((c) => <li key={c} className="rounded-lg border border-ink-700 bg-ink-900/50 p-3">▸ {c}</li>)}</ul></Card>
      </div>
    </div>
  );
}
