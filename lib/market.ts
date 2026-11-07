// Market benchmarks from sourced competitor prices + logged market quotes (pure; unit-tested).
export type PricePoint = { service: string; text?: string; low: number | null; high: number | null; unit: string; source?: string };
export type Competitor = { slug: string; name: string; services_claimed: string[]; services_evidenced: string[]; prices: PricePoint[] };

/** Our price-book service → competitor service tags that are comparable. */
export const COMPARABLE: Record<string, string[]> = {
  flatwork: ["flatwork", "parking_garage", "dumpster_pad"],
  storefront: ["storefront", "building_wash"],
  driveway: ["driveway"],
  softwash: ["softwash_house"],
  roof: ["roof"],
  gutter: ["gutter"],
  sealing: ["sealing"],
};

export const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export type Benchmark = {
  service: string;
  unit: string;
  perUnit: { low: number; median: number; high: number; n: number } | null; // $/unit
  jobMinimums: { low: number; median: number; high: number; n: number } | null; // "starting at" $ per job/visit
  points: { competitor: string; text: string; source?: string }[];
};

export function benchmark(service: string, unit: string, comps: Competitor[], extra: { service: string; perUnit?: number; amount?: number; competitor: string }[] = []): Benchmark {
  const tags = COMPARABLE[service] ?? [service];
  const per: number[] = [], jobs: number[] = [];
  const points: Benchmark["points"] = [];
  for (const c of comps)
    for (const p of c.prices)
      if (tags.includes(p.service) && p.low != null) {
        const v = p.high != null ? (p.low + p.high) / 2 : p.low;
        if (p.unit === unit) per.push(v);
        else if (["job", "visit", "home"].includes(p.unit)) jobs.push(p.low);
        else continue;
        points.push({ competitor: c.name, text: p.text ?? `${p.low}${p.high ? `–${p.high}` : ""}/${p.unit}`, source: p.source });
      }
  for (const e of extra)
    if (tags.includes(e.service)) {
      if (e.perUnit) per.push(e.perUnit);
      else if (e.amount) jobs.push(e.amount);
      points.push({ competitor: e.competitor, text: e.perUnit ? `$${e.perUnit}/${unit} (logged quote)` : `$${e.amount} job (logged quote)` });
    }
  const stat = (xs: number[]) => (xs.length ? { low: Math.min(...xs), median: median(xs)!, high: Math.max(...xs), n: xs.length } : null);
  return { service, unit, perUnit: stat(per), jobMinimums: stat(jobs), points };
}

/** Share of claimed services that have no evidence of actually being performed. */
export const sayDoGap = (c: Competitor) =>
  c.services_claimed.length ? 1 - c.services_claimed.filter((s) => c.services_evidenced.includes(s)).length / c.services_claimed.length : 0;

export function position(ours: number, b: Benchmark["perUnit"]) {
  if (!b) return "no data";
  if (ours < b.low) return "below market";
  if (ours > b.high) return "above market";
  return ours < b.median ? "under median" : ours > b.median ? "over median" : "at median";
}
