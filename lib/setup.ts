// Builds the SQL that initializes a D1 database: schema + price book + sourced competitor research,
// and (optionally) a full reset with alpha-test data. Applied with `wrangler d1 execute --file`
// (scripts/db-setup.ts), which works identically against local and remote D1. Pure; no I/O.
import { CITY_COORDS } from "./content.ts";
import { DEFAULT_RULES } from "./pricing.ts";
import { addDays, ctDate, ctToUtc } from "./tz.ts";

export type SetupOptions = { schemaSql: string; competitors?: any[]; seed?: boolean; passwordHash?: string; now?: Date; uuid?: () => string };

/** SQL literal: strings quoted, arrays/objects stored as JSON text, booleans as 0/1. */
export function lit(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return lit(v.toISOString());
  if (typeof v === "object") return lit(JSON.stringify(v));
  return `'${String(v).replace(/'/g, "''")}'`;
}
const insert = (table: string, row: Record<string, unknown>) =>
  `INSERT INTO ${table} (${Object.keys(row).join(",")}) VALUES (${Object.values(row).map(lit).join(",")});`;

const TABLES = ["market_quotes", "competitors", "email_outbox", "campaigns", "map_markers", "service_zones", "payment_methods", "invoices",
  "job_photos", "jobs", "quotes", "leads", "crew_members", "crews", "clients", "magic_links", "users", "pricing_rules"];

export function buildSetupSql({ schemaSql, competitors, seed = false, passwordHash, now = new Date(), uuid = () => crypto.randomUUID() }: SetupOptions): string {
  const out: string[] = [];
  if (seed) out.push(...TABLES.map((t) => `DROP TABLE IF EXISTS ${t};`), "DROP TRIGGER IF EXISTS invoices_number;");
  out.push(schemaSql);
  for (const r of DEFAULT_RULES)
    out.push(insert("pricing_rules", { service: r.service, label: r.label, unit: r.unit, rate: r.rate, min_cents: r.min_cents, production_per_hour: r.production_per_hour, equipment: r.equipment, phase: r.phase, description: r.description })
      .replace(/;$/, " ON CONFLICT (service) DO NOTHING;"));

  // --- Sourced competitor research → competitors + derived map layers (city-level placement, stable per-company offset)
  if (competitors) {
    out.push("DELETE FROM map_markers WHERE layer IN ('competitor','pricing');");
    for (const c of competitors) {
      const coords = CITY_COORDS[c.base_city]; // undefined for out-of-market HQs (e.g. national lead-gen sites) → no map pin
      const h = [...(c.slug as string)].reduce((a: number, ch: string) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
      const lat = coords ? coords[0] + ((h % 100) - 50) / 2500 : null, lng = coords ? coords[1] + (((h >> 8) % 100) - 50) / 2500 : null;
      const row = { slug: c.slug, name: c.name, website: c.website, base_city: c.base_city, lat, lng, location_precision: "city", kind: c.kind ?? "local", focus: c.focus ?? "mixed",
        services_claimed: c.services_claimed ?? [], services_evidenced: c.services_evidenced ?? [], prices: c.prices ?? [], strategies: c.strategies ?? [],
        confidence: c.confidence ?? "medium", notes: c.notes ?? null, sources: c.sources ?? [], retrieved_at: c.retrieved_at ?? ctDate(now) };
      out.push(insert("competitors", row).replace(/;$/, ` ON CONFLICT (slug) DO UPDATE SET ${Object.keys(row).filter((k) => k !== "slug").map((k) => `${k}=excluded.${k}`).join(",")};`));
      if (!coords) continue;
      out.push(insert("map_markers", { id: uuid(), layer: "competitor", label: c.name, lat, lng, radius_m: 1800, value: (c.services_claimed ?? []).length,
        notes: `${c.focus} · ${c.base_city ?? "base city not published"} · claims ${(c.services_claimed ?? []).length} services, work evidence for ${(c.services_evidenced ?? []).length}` }));
      for (const p of (c.prices ?? []).filter((p: any) => p.unit === "sqft" && p.low))
        out.push(insert("map_markers", { id: uuid(), layer: "pricing", label: `${c.name}: $${p.low}/sqft ${p.service}`, lat, lng, radius_m: 3500, value: p.low, notes: p.text }));
    }
  }
  if (!seed) return out.join("\n");
  if (!passwordHash) throw new Error("passwordHash required for seed");

  // --- Team: three partners + field crew (demo password alpha2026!)
  const user = (email: string, name: string, role: string) => { const id = uuid(); out.push(insert("users", { id, email, name, role, password_hash: passwordHash, phone: "512-555-0100" })); return id; };
  user("ops@shoalcreek.test", "Partner — Operations", "owner");
  user("sales@shoalcreek.test", "Partner — Sales", "owner");
  user("finance@shoalcreek.test", "Partner — Finance", "owner");
  const crewUsers = [user("alpha@shoalcreek.test", "Crew Lead Alpha", "crew"), user("bravo@shoalcreek.test", "Crew Lead Bravo", "crew"), user("charlie@shoalcreek.test", "Crew Lead Charlie", "crew")];
  const ALL = ["hot-water unit", "surface cleaner", "reclaim mat", "soft-wash rig", "ladders", "gutter vac", "fall protection", "sprayer"];
  const crewDefs: [string, string, number, number, number, string[]][] = [
    ["Crew Alpha", "#22d3ee", 3, 30.3072, -97.7231, ALL],
    ["Crew Bravo", "#a3e635", 2, 30.4794, -97.68, ["hot-water unit", "surface cleaner", "reclaim mat", "sprayer"]],
    ["Crew Charlie", "#f472b6", 2, 30.5052, -97.8203, ["soft-wash rig", "ladders", "gutter vac", "fall protection", "surface cleaner"]],
  ];
  const crews = crewDefs.map(([name, color, size, home_lat, home_lng, equipment], i) => {
    const id = uuid();
    out.push(insert("crews", { id, name, color, size, home_lat, home_lng, equipment }), insert("crew_members", { crew_id: id, user_id: crewUsers[i] }));
    return id;
  });

  // --- Clients (fictional sample accounts)
  const C = [
    ["client@shoalcreek.test", "Sample Property Group", "Jordan Rivera", "property_management", "2100 S Lamar Blvd, Austin, TX", 30.2465, -97.7795],
    ["retail@shoalcreek.test", "Northgate Retail Commons (sample)", "Casey Nguyen", "retail_center", "2701 S I-35 Frontage Rd, Round Rock, TX", 30.4846, -97.6747],
    ["hoa@shoalcreek.test", "Cedar Hollow HOA (sample)", "Morgan Patel", "hoa", "1400 Cypress Creek Rd, Cedar Park, TX", 30.4836, -97.8302],
    ["cafe@shoalcreek.test", "Pecan Street Cafe (sample)", "Riley Brooks", "restaurant", "100 E Pecan St, Pflugerville, TX", 30.4394, -97.62],
    ["home@shoalcreek.test", null, "Taylor Kim", "residential", "4500 Shoal Creek Blvd, Austin, TX", 30.3156, -97.7487],
  ] as const;
  const clients = C.map(([email, company, contact_name, segment, address, lat, lng]) => {
    const user_id = user(email, contact_name, "client"), id = uuid();
    out.push(insert("clients", { id, user_id, company, contact_name, email, segment, address, lat, lng, phone: "512-555-0142" }));
    return id;
  });

  // --- Jobs: history, this week, and an unassigned backlog for the planner (Central-time days relative to today)
  const today = ctDate(now);
  const at = (day: number, hour: number) => ctToUtc(addDays(today, day), `${String(hour).padStart(2, "0")}:00`);
  type J = [client: number, crew: number | null, day: number, hour: number, title: string, service: string, minutes: number, price: number, status: string, freq?: string, size?: number, equip?: string[], dLat?: number, dLng?: number];
  const J: J[] = [
    [0, 0, -28, 7, "Parking lot + sidewalks — Lamar site", "flatwork", 240, 1850, "completed", "quarterly"],
    [1, 1, -21, 22, "Overnight flatwork + dumpster pads", "flatwork", 300, 2400, "completed", "monthly"],
    [3, 1, -14, 21, "Drive-thru & patio degrease", "flatwork", 120, 450, "completed", "monthly"],
    [2, 2, -10, 8, "Amenity center soft wash", "softwash", 210, 1200, "completed", "biannual", 2, ["soft-wash rig"]],
    [4, 2, -7, 9, "Driveway + house wash", "driveway", 150, 520, "completed"],
    [1, 1, -1, 22, "Overnight flatwork (monthly)", "flatwork", 300, 2400, "completed", "monthly"],
    [0, 0, 0, 7, "Breezeways & stairwells — Building B", "flatwork", 180, 1400, "in_progress", "quarterly", 3, [], 0.004, 0.006],
    [3, 1, 0, 14, "Dumpster pad degrease", "flatwork", 90, 300, "en_route", "monthly"],
    [2, 2, 0, 9, "Entry monument + clubhouse gutters", "gutter", 180, 650, "scheduled", "biannual", 2, ["gutter vac", "ladders"]],
    [0, 0, 1, 8, "Garage level P1–P2", "flatwork", 300, 2200, "scheduled", "quarterly", 3, [], -0.01, 0.012],
    [1, 1, 2, 22, "Storefront row facades", "storefront", 240, 1600, "scheduled", "monthly", 2, ["hot-water unit"]],
    [4, 2, 3, 10, "Gutter cleaning (2-story)", "gutter", 120, 380, "scheduled"],
    [2, 0, 4, 8, "Pool deck sealing", "sealing", 360, 2900, "scheduled", "one_time", 2, ["sprayer"]],
    [0, null, 1, 9, "Courtyard pavers — Building D", "flatwork", 150, 900, "scheduled", "quarterly", 2, [], 0.018, -0.02],
    [1, null, 1, 10, "Sidewalk gum removal — Phase 2 lots", "flatwork", 200, 1300, "scheduled", "monthly", 2, [], -0.02, 0.01],
    [3, null, 1, 13, "Patio + entry wash", "storefront", 90, 350, "scheduled", "monthly", 1, []],
    [2, null, 1, 9, "Pavilion roof soft wash", "roof", 240, 1400, "scheduled", "biannual", 2, ["soft-wash rig", "fall protection"]],
  ];
  const svg = (label: string, a: string, b: string) =>
    "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x2='1' y2='1'><stop stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><text x='24' y='376' font-family='sans-serif' font-size='28' fill='white'>${label} · sample photo</text></svg>`);
  let invoiceNo = 0;
  for (const [ci, cr, day, hour, title, service, minutes, price, status, freq = "one_time", size = 2, equip = ["hot-water unit", "surface cleaner"], dLat = 0, dLng = 0] of J) {
    const id = uuid(), start = at(day, hour), c = C[ci];
    const actual = status === "completed" ? Math.round(minutes * (0.9 + (title.length % 5) * 0.06)) : null;
    out.push(insert("jobs", {
      id, client_id: clients[ci], crew_id: cr === null ? null : crews[cr], title, service, address: c[4], lat: c[5] + dLat, lng: c[6] + dLng, scheduled_start: start,
      quoted_minutes: minutes, actual_minutes: actual, crew_size: size, equipment: equip, frequency: freq, price_cents: price * 100, status,
      clock_in: ["in_progress", "completed"].includes(status) ? start : null,
      clock_out: status === "completed" ? new Date(new Date(start).getTime() + actual! * 60000).toISOString() : null,
    }));
    if (status !== "completed") continue;
    out.push(
      insert("job_photos", { id: uuid(), job_id: id, kind: "before", data_url: svg("Before", "#3f3a2e", "#1d1b16"), taken_by: crewUsers[cr ?? 0] }),
      insert("job_photos", { id: uuid(), job_id: id, kind: "after", data_url: svg("After", "#cbd5e1", "#94a3b8"), taken_by: crewUsers[cr ?? 0] }),
    );
    const paid = day < -10;
    out.push(insert("invoices", {
      id: uuid(), number: ++invoiceNo, client_id: clients[ci], job_id: id, description: title, amount_cents: price * 100, status: paid ? "paid" : "open",
      due_date: addDays(today, day + 15), paid_at: paid ? new Date(now.getTime() + (day + 2) * 864e5) : null, payment_method: paid ? "Visa •••• 4242" : null,
    }));
  }
  out.push(insert("payment_methods", { id: uuid(), client_id: clients[0], kind: "card", label: "Visa •••• 4242", is_default: true }),
    insert("payment_methods", { id: uuid(), client_id: clients[0], kind: "ach", label: "Business checking •••• 6789", is_default: false }));

  // --- CRM leads
  const L: [string, string, string, string, string, number, string, number, number][] = [
    ["Avery Coleman", "Sample Office Park", "office_park", "Austin", "new", 1800000, "website", 30.4012, -97.7253],
    ["Drew Hamilton", "Riverside Multifamily (sample)", "multifamily", "Austin", "new", 950000, "referral", 30.238, -97.724],
    ["Sam Ortiz", "Brushy Creek HOA (sample)", "hoa", "Round Rock", "contacted", 640000, "door-to-door", 30.511, -97.73],
    ["Jamie Lee", "Main St Bakery (sample)", "storefront", "Round Rock", "contacted", 120000, "instagram", 30.5083, -97.6789],
    ["Quinn Foster", "Sample Asset Partners", "property_management", "Austin", "quoted", 4200000, "linkedin", 30.2672, -97.7431],
    ["Reese Walker", "Pflugerville Plaza (sample)", "retail_center", "Pflugerville", "quoted", 1450000, "cold email", 30.456, -97.61],
    ["Parker Diaz", "Taco Spot #3 (sample)", "restaurant", "Cedar Park", "won", 380000, "website", 30.52, -97.81],
    ["Emerson Hall", "Sample Property Group", "property_management", "Austin", "retained", 2800000, "referral", 30.2465, -97.7795],
    ["Rowan Price", "Lakeview Townhomes (sample)", "hoa", "Cedar Park", "lost", 300000, "website", 30.495, -97.85],
    ["Hayden Brooks", "Sample Dental Studio", "storefront", "Austin", "new", 90000, "google", 30.35, -97.735],
  ];
  for (const [name, company, segment, city, stage, value_cents, source, lat, lng] of L)
    out.push(insert("leads", { id: uuid(), name, company, email: name.split(" ")[0].toLowerCase() + "@example.com", segment, city, stage, value_cents, source, lat, lng }));

  // --- Service zones ([lat,lng] polygons, approximate)
  const Z: [string, string, number, number[][], string][] = [
    ["Austin Core", "#22d3ee", 1, [[30.36, -97.8], [30.36, -97.68], [30.22, -97.68], [30.2, -97.8], [30.26, -97.84]], "Downtown, Domain-to-SoCo corridor"],
    ["North Metro — Round Rock / Pflugerville", "#a3e635", 1, [[30.56, -97.72], [30.56, -97.57], [30.4, -97.57], [30.38, -97.68], [30.42, -97.74]], "I-35 / SH-130 retail and multifamily"],
    ["Cedar Park / Leander", "#f472b6", 1, [[30.6, -97.9], [30.6, -97.78], [30.46, -97.76], [30.44, -97.86]], "183A corridor, HOAs"],
    ["Georgetown (Phase 2)", "#fbbf24", 2, [[30.7, -97.74], [30.7, -97.62], [30.58, -97.62], [30.58, -97.74]], "Expansion after 3rd crew"],
    ["Buda / Kyle (Phase 2)", "#fbbf24", 2, [[30.12, -97.9], [30.12, -97.78], [29.96, -97.78], [29.96, -97.9]], "Expansion — residential growth"],
  ];
  for (const [name, color, phase, polygon, notes] of Z) out.push(insert("service_zones", { id: uuid(), name, color, phase, polygon, notes }));

  // --- Commercial corridors (density hotspots)
  const M: [string, number, number, number, number, string][] = [
    ["Domain / North Burnet retail + office", 30.4021, -97.7253, 2200, 0.95, "High-density Class A retail"],
    ["Downtown CBD", 30.2672, -97.7431, 2000, 0.9, "Office towers, plazas, garages"],
    ["I-35 Round Rock retail corridor", 30.4846, -97.6747, 2600, 0.85, "Big-box + strip centers"],
    ["Parmer Ln tech campuses", 30.417, -97.695, 2400, 0.75, "Office parks, garages"],
    ["183A Cedar Park commercial", 30.4836, -97.8302, 2200, 0.7, "Strip centers, restaurants"],
    ["SH-130 Pflugerville growth", 30.456, -97.61, 2400, 0.6, "New retail + multifamily"],
    ["South Lamar / SoCo", 30.2465, -97.76, 1800, 0.8, "Restaurants + storefronts"],
  ];
  for (const [label, lat, lng, radius_m, value, notes] of M) out.push(insert("map_markers", { id: uuid(), layer: "hotspot", label, lat, lng, radius_m, value, notes }));

  // --- Campaigns + outbox
  out.push(
    insert("campaigns", { id: uuid(), name: "Fall reset — commercial", subject: "Post-summer grime? Get a fall reset for {{company}}", body: "Hi {{first_name}},\n\nSummer left its mark. Book a fall flatwork reset this month and save 10%.\n\n— Shoal Creek Clean", audience: "commercial", status: "sent", recipient_count: 6, sent_at: new Date(now.getTime() - 9 * 864e5) }),
    insert("campaigns", { id: uuid(), name: "Holiday storefront prep", subject: "Make {{company}} shine for holiday shoppers", body: "Hi {{first_name}},\n\nHoliday traffic is coming. We'll wash your storefront overnight so you never lose a trading hour.\n\n— Shoal Creek Clean", audience: "storefront", status: "draft" }),
    insert("email_outbox", { id: uuid(), to_email: "client@shoalcreek.test", subject: "Your job is complete — photos inside", body: "Your recent service is complete. View before/after photos in your client portal.", kind: "transactional" }),
  );
  return out.join("\n");
}
