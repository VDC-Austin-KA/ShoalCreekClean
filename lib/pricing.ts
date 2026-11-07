// Pure pricing engine. Rates come from the `pricing_rules` table (editable in /admin/pricing);
// DEFAULT_RULES is the launch price book and the seed source. See docs/MARKET_STRATEGY.md.

export type Rule = {
  service: string;
  label: string;
  unit: "sqft" | "lf";
  rate: number; // $ per unit
  min_cents: number;
  production_per_hour: number; // units per tech-hour
  equipment: string[];
  phase: number;
  description: string;
};

export const DEFAULT_RULES: Rule[] = [
  { service: "flatwork", label: "Commercial flatwork (lots, sidewalks, plazas)", unit: "sqft", rate: 0.18, min_cents: 25000, production_per_hour: 1200, equipment: ["hot-water unit", "surface cleaner", "reclaim mat"], phase: 1, description: "Hot-water pressure wash with 20\" surface cleaners and wash-water reclamation." },
  { service: "storefront", label: "Storefront & entry facade", unit: "sqft", rate: 0.3, min_cents: 17500, production_per_hour: 800, equipment: ["hot-water unit", "soft-wash rig"], phase: 1, description: "Entries, awnings, columns, gum and stain removal." },
  { service: "driveway", label: "Residential driveway / patio", unit: "sqft", rate: 0.22, min_cents: 15000, production_per_hour: 1000, equipment: ["surface cleaner"], phase: 1, description: "Driveways, walkways, patios, pool decks." },
  { service: "softwash", label: "Building / siding soft wash", unit: "sqft", rate: 0.28, min_cents: 30000, production_per_hour: 600, equipment: ["soft-wash rig", "ladders"], phase: 2, description: "Low-pressure chemical wash for siding, stucco, brick, EIFS." },
  { service: "roof", label: "Roof soft wash", unit: "sqft", rate: 0.35, min_cents: 35000, production_per_hour: 500, equipment: ["soft-wash rig", "fall protection"], phase: 2, description: "Algae / lichen treatment, manufacturer-safe." },
  { service: "gutter", label: "Gutter cleaning", unit: "lf", rate: 1.4, min_cents: 20000, production_per_hour: 120, equipment: ["ladders", "gutter vac", "fall protection"], phase: 2, description: "Debris removal, downspout flush, photo verification." },
  { service: "sealing", label: "Surface sealing", unit: "sqft", rate: 0.85, min_cents: 40000, production_per_hour: 400, equipment: ["sprayer", "surface cleaner"], phase: 2, description: "Penetrating or film-forming sealer on concrete and pavers." },
];

export const HEIGHT = { "1": 1.0, "2": 1.25, "3": 1.5, "4": 1.85 } as const;
export const LIFT_FEE_CENTS = 35000;
export const SURFACE = { concrete: 1.0, pavers: 1.15, stone: 1.2, brick: 1.1, stucco: 1.15, siding: 1.0, wood: 1.2, metal: 1.05 } as const;
export const SOIL = { light: 0.9, moderate: 1.0, heavy: 1.35 } as const;
export const FREQUENCY = { one_time: 0, biannual: 0.08, quarterly: 0.15, monthly: 0.22 } as const;
export const AFTER_HOURS = 0.15;
export const REVIEW_THRESHOLD_CENTS = 750000;

export type QuoteItemInput = {
  service: string;
  quantity: number; // sqft or lf
  surface: keyof typeof SURFACE;
};
export type QuoteInput = {
  property: "commercial" | "residential";
  items: QuoteItemInput[];
  stories: keyof typeof HEIGHT;
  soil: keyof typeof SOIL;
  frequency: keyof typeof FREQUENCY;
  afterHours?: boolean;
};
export type LineItem = { service: string; label: string; quantity: number; unit: string; amount_cents: number; note?: string };
export type QuoteResult = {
  line_items: LineItem[];
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  est_hours: number; // crew-hours on site
  crew_size: number;
  equipment: string[];
  needs_review: boolean;
  review_reasons: string[];
};

const r2 = (n: number) => Math.round(n);

export function computeQuote(input: QuoteInput, rules: Rule[] = DEFAULT_RULES): QuoteResult {
  const byService = new Map(rules.map((r) => [r.service, r]));
  const height = HEIGHT[input.stories] ?? 1;
  const soil = SOIL[input.soil] ?? 1;
  const items = input.items.filter((i) => byService.has(i.service) && i.quantity > 0);
  const line_items: LineItem[] = [];
  let techHours = 0;
  const equipment = new Set<string>();
  const reasons: string[] = [];

  for (const it of items) {
    const rule = byService.get(it.service)!;
    const qty = Math.min(Math.max(0, Math.round(it.quantity)), 2_000_000);
    const surface = SURFACE[it.surface] ?? 1;
    // Height only applies to vertical/elevated work.
    const h = ["flatwork", "driveway", "sealing"].includes(rule.service) ? 1 : height;
    const raw = qty * rule.rate * 100 * surface * soil * h;
    const amount = Math.max(raw, rule.min_cents);
    line_items.push({
      service: rule.service,
      label: rule.label,
      quantity: qty,
      unit: rule.unit,
      amount_cents: r2(amount),
      note: amount > raw ? "minimum charge" : h > 1 ? `${input.stories}-story modifier` : undefined,
    });
    techHours += (qty / rule.production_per_hour) * soil * h;
    rule.equipment.forEach((e) => equipment.add(e));
    if (rule.service === "sealing" && qty > 20000) reasons.push("Sealing area over 20,000 sq ft");
  }

  if (input.stories === "4" && items.some((i) => !["flatwork", "driveway", "sealing"].includes(i.service))) {
    line_items.push({ service: "lift", label: "Boom / scissor lift rental", quantity: 1, unit: "ea", amount_cents: LIFT_FEE_CENTS });
    equipment.add("boom lift");
    reasons.push("4+ story access requires a site survey");
  }
  if (input.afterHours && input.property === "commercial") {
    const base = line_items.reduce((s, l) => s + l.amount_cents, 0);
    line_items.push({ service: "after_hours", label: "After-hours / overnight service", quantity: 1, unit: "ea", amount_cents: r2(base * AFTER_HOURS) });
  }

  const subtotal = line_items.reduce((s, l) => s + l.amount_cents, 0);
  const discount = r2(subtotal * (FREQUENCY[input.frequency] ?? 0));
  const total = subtotal - discount;
  if (total > REVIEW_THRESHOLD_CENTS) reasons.push("Estimate exceeds $7,500 — partner review");
  const crewSize = Math.min(4, Math.max(input.stories !== "1" ? 2 : 1, Math.ceil(techHours / 6)));
  return {
    line_items,
    subtotal_cents: subtotal,
    discount_cents: discount,
    total_cents: total,
    est_hours: Math.round((techHours / crewSize + 0.5) * 4) / 4, // + setup/teardown, quarter-hour
    crew_size: crewSize,
    equipment: [...equipment],
    needs_review: reasons.length > 0,
    review_reasons: reasons,
  };
}
