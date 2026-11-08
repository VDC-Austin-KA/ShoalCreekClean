import { q } from "@/lib/db";
import { loadRules } from "@/lib/rules";
import { benchmark, position, sayDoGap, type Competitor } from "@/lib/market";
import { Badge, Card, Empty, PageHeader, cx } from "@/components/ui";
import { usd, dt } from "@/lib/format";
import { LogQuote } from "./LogQuote";

export const dynamic = "force-dynamic";
const TAGS = ["flatwork", "parking_garage", "dumpster_pad", "storefront", "building_wash", "softwash_house", "roof", "gutter", "driveway", "sealing", "deck_fence", "window", "graffiti", "holiday_lighting"];
const CONF: Record<string, string> = { high: "paid", medium: "open", low: "failed" };

export default async function Competitors() {
  const [comps, quotes, rules] = await Promise.all([
    q<Competitor & any>("SELECT * FROM competitors ORDER BY CASE confidence WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, name"),
    q("SELECT * FROM market_quotes ORDER BY created_at DESC LIMIT 100"),
    loadRules(),
  ]);
  if (!comps.length) return <Empty>No competitor research loaded. Run <code>npm run db:setup</code> to import data/competitors.json.</Empty>;
  const extra = quotes.map((m) => ({ service: m.service, competitor: `${m.competitor} (${m.source})`, perUnit: m.quantity ? +(m.amount_cents / 100 / Number(m.quantity)).toFixed(3) : undefined, amount: m.quantity ? undefined : m.amount_cents / 100 }));
  // Low-confidence sources (lead-gen marketplaces, SEO doorway sites, self-contradicting claims) are shown but not benchmarked.
  const trusted = comps.filter((c) => c.confidence !== "low");
  const bench = rules.map((r) => ({ r, b: benchmark(r.service, r.unit, trusted, extra) }));
  const retrieved = comps.map((c) => c.retrieved_at).sort().at(-1);
  return (
    <div className="space-y-6">
      <PageHeader title="Competitor intelligence" sub={`${comps.length} real Central Texas operators · public websites + marketplace reviews · retrieved ${dt(retrieved, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`} />

      <Card title="Our price book vs. published market prices">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-slate-500"><tr><th className="py-2">Service</th><th>Ours</th><th>Market $/unit (low · median · high)</th><th>Position</th><th>“Starting at” job prices</th><th>n</th></tr></thead>
          <tbody className="divide-y divide-ink-700">
            {bench.map(({ r, b }) => {
              const pos = position(r.rate, b.perUnit);
              return (
                <tr key={r.service} className="align-top">
                  <td className="py-3 pr-3 text-slate-200">{r.label}</td>
                  <td className="tabular-nums">${r.rate}/{r.unit}<div className="text-xs text-slate-500">min {usd(r.min_cents)}</div></td>
                  <td className="tabular-nums">{b.perUnit ? `$${b.perUnit.low} · $${+b.perUnit.median.toFixed(3)} · $${b.perUnit.high}` : <span className="text-slate-600">no published per-unit price</span>}</td>
                  <td><span className={cx("chip", pos.includes("above") ? "border-rose-400/40 text-rose-300" : pos.includes("below") ? "border-amber-400/40 text-amber-300" : pos === "no data" ? "border-ink-700 text-slate-500" : "border-lime-400/40 text-lime-300")}>{pos}</span></td>
                  <td className="tabular-nums">{b.jobMinimums ? `${usd(b.jobMinimums.low * 100)} – ${usd(b.jobMinimums.high * 100)}` : "—"}</td>
                  <td className="text-slate-500">{b.points.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
        <p className="mt-3 text-xs text-slate-500">Only prices a company publishes itself (or quotes logged below) are counted, from {trusted.length} medium/high-confidence sources; blog “industry average” figures and low-confidence sites are excluded. Most commercial operators publish no prices — commercial benchmarks need logged quotes.</p>
      </Card>

      <Card title="Services claimed vs. evidenced">
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-slate-500"><th className="py-2 pr-3 text-left">Company</th>{TAGS.map((t) => <th key={t} className="px-1 font-normal [writing-mode:vertical-rl] rotate-180 h-28 text-left">{t.replace("_", " ")}</th>)}<th className="pl-3 text-left">Say/do gap</th></tr></thead>
          <tbody className="divide-y divide-ink-700">
            {comps.map((c) => (
              <tr key={c.slug}>
                <td className="py-2 pr-3 text-sm text-slate-200 whitespace-nowrap">{c.name}</td>
                {TAGS.map((t) => <td key={t} className="px-1 text-center">{c.services_evidenced.includes(t) ? <span className="text-lime-400" title="claimed + evidenced">●</span> : c.services_claimed.includes(t) ? <span className="text-slate-500" title="claimed only">○</span> : ""}</td>)}
                <td className="pl-3 tabular-nums text-slate-300">{Math.round(sayDoGap(c) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <p className="mt-3 text-xs text-slate-500">● claimed and backed by gallery photos, case studies, named clients or customer reviews · ○ listed on the site with no evidence found. A high gap marks services a competitor lists for SEO but rarely sells.</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {comps.map((c) => (
          <Card key={c.slug} title={<a href={c.website} target="_blank" rel="noreferrer" className="hover:text-accent">{c.name} ↗</a>} action={<Badge status={CONF[c.confidence]}>{c.confidence} confidence</Badge>}>
            <div className="text-xs text-slate-500">{c.base_city ?? "Base city not published"} · {c.kind} · {c.focus} focus</div>
            {c.prices.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">{c.prices.map((p: any, i: number) => <li key={i} className="flex justify-between gap-3"><span className="text-slate-400">{p.service.replace("_", " ")}</span><a href={p.source} target="_blank" rel="noreferrer" className="text-right text-slate-200 hover:text-accent">{p.text}</a></li>)}</ul>
            ) : <p className="mt-3 text-sm text-slate-500">No prices published.</p>}
            {c.strategies.length > 0 && <ul className="mt-3 flex flex-wrap gap-1.5">{c.strategies.slice(0, 10).map((s: string) => <li key={s} className="chip border-ink-700 normal-case tracking-normal text-slate-400">{s}</li>)}</ul>}
            {c.notes && <p className="mt-3 text-xs text-slate-500">{c.notes}</p>}
            <details className="mt-3 text-xs text-slate-600"><summary className="cursor-pointer">{c.sources.length} sources</summary><ul className="mt-1 space-y-0.5">{c.sources.map((s: string) => <li key={s}><a href={s} target="_blank" rel="noreferrer" className="break-all hover:text-accent">{s}</a></li>)}</ul></details>
          </Card>
        ))}
      </div>

      <Card title="Logged market quotes (real-time pricing)">
        <LogQuote />
        {quotes.length ? (
          <ul className="mt-4 divide-y divide-ink-700 text-sm">{quotes.map((m) => (
            <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2"><span className="text-slate-300">{m.competitor} · {m.service}{m.quantity ? ` · ${Number(m.quantity).toLocaleString()} ${m.unit}` : ""} · {m.city ?? "—"}</span><span className="tabular-nums text-slate-200">{usd(m.amount_cents)} <span className="text-xs text-slate-500">{m.source}</span></span></li>
          ))}</ul>
        ) : <p className="mt-3 text-xs text-slate-500">No quotes yet. Prospects can share a competing quote in the instant-quote form (price-match offer), and partners can log quotes here.</p>}
      </Card>
    </div>
  );
}
