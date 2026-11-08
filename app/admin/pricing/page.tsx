import { loadRules } from "@/lib/rules";
import { Card, PageHeader } from "@/components/ui";
import { HEIGHT, SOIL, SURFACE, FREQUENCY } from "@/lib/pricing";
import { RuleRow } from "./RuleRow";

export const dynamic = "force-dynamic";
export default async function Pricing() {
  const rules = await loadRules();
  const mods: [string, Record<string, number>, (v: number) => string][] = [
    ["Height", HEIGHT, (v) => `×${v}`], ["Surface", SURFACE, (v) => `×${v}`], ["Soil", SOIL, (v) => `×${v}`], ["Frequency discount", FREQUENCY, (v) => `−${v * 100}%`],
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Price book" sub="Base rates drive the public instant-quote engine. Edits apply immediately." />
      <Card title="Service rates">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-slate-500"><tr><th className="py-2">Service</th><th>Rate ($/unit)</th><th>Minimum ($)</th><th>Units / tech-hr</th><th>Phase</th><th /></tr></thead>
          <tbody className="divide-y divide-ink-700">{rules.map((r) => <RuleRow key={r.service} rule={r} />)}</tbody>
        </table></div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mods.map(([t, m, f]) => (
          <Card key={t} title={t}><ul className="space-y-1 text-sm">{Object.entries(m).map(([k, v]) => <li key={k} className="flex justify-between capitalize"><span className="text-slate-400">{k.replace("_", " ")}{t === "Height" ? " story" : ""}</span><span className="tabular-nums">{f(v)}</span></li>)}</ul></Card>
        ))}
      </div>
      <p className="text-xs text-slate-500">Auto-quotes over $7,500, 4+ stories, or sealing over 20,000 sq ft route to partner review. 4+ story vertical work adds a $350 lift fee. Market benchmarks: docs/MARKET_STRATEGY.md.</p>
    </div>
  );
}
