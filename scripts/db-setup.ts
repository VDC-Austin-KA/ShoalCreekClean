// Usage: node scripts/db-setup.ts [--seed]   (Node >= 22.18 strips TS types natively)
// Applies db/schema.sql; with --seed, wipes and loads alpha-test data.
import { readFileSync } from "node:fs";
import pg from "pg";
import bcrypt from "bcryptjs";
import { DEFAULT_RULES } from "../lib/pricing.ts";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });
await db.connect();
await db.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("schema applied");

for (const r of DEFAULT_RULES)
  await db.query(
    `INSERT INTO pricing_rules (service,label,unit,rate,min_cents,production_per_hour,equipment,phase,description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (service) DO NOTHING`,
    [r.service, r.label, r.unit, r.rate, r.min_cents, r.production_per_hour, r.equipment, r.phase, r.description],
  );

if (!process.argv.includes("--seed")) { await db.end(); process.exit(0); }

await db.query(`TRUNCATE email_outbox, campaigns, map_markers, service_zones, payment_methods, invoices, job_photos, jobs, quotes, leads, crew_members, crews, clients, magic_links, users RESTART IDENTITY CASCADE`);
const hash = await bcrypt.hash("alpha2026!", 10);
const ins = async (sql: string, p: unknown[]) => (await db.query(sql + " RETURNING id", p)).rows[0].id as string;
const user = (email: string, name: string, role: string, phone = "512-555-0100") =>
  ins("INSERT INTO users (email,name,role,password_hash,phone) VALUES ($1,$2,$3,$4,$5)", [email, name, role, hash, phone]);

// --- Team: three partners + field crew
await user("ops@shoalcreek.test", "Partner — Operations", "owner");
await user("sales@shoalcreek.test", "Partner — Sales", "owner");
await user("finance@shoalcreek.test", "Partner — Finance", "owner");
const crewUsers = [
  await user("alpha@shoalcreek.test", "Crew Lead Alpha", "crew"),
  await user("bravo@shoalcreek.test", "Crew Lead Bravo", "crew"),
  await user("charlie@shoalcreek.test", "Crew Lead Charlie", "crew"),
];
const ALL = ["hot-water unit", "surface cleaner", "reclaim mat", "soft-wash rig", "ladders", "gutter vac", "fall protection", "sprayer"];
const crews = [
  await ins("INSERT INTO crews (name,color,size,home_lat,home_lng,equipment) VALUES ($1,$2,$3,$4,$5,$6)", ["Crew Alpha", "#22d3ee", 3, 30.3072, -97.7231, ALL]),
  await ins("INSERT INTO crews (name,color,size,home_lat,home_lng,equipment) VALUES ($1,$2,$3,$4,$5,$6)", ["Crew Bravo", "#a3e635", 2, 30.4794, -97.6800, ["hot-water unit", "surface cleaner", "reclaim mat", "sprayer"]]),
  await ins("INSERT INTO crews (name,color,size,home_lat,home_lng,equipment) VALUES ($1,$2,$3,$4,$5,$6)", ["Crew Charlie", "#f472b6", 2, 30.5052, -97.8203, ["soft-wash rig", "ladders", "gutter vac", "fall protection", "surface cleaner"]]),
];
for (let i = 0; i < 3; i++) await db.query("INSERT INTO crew_members VALUES ($1,$2)", [crews[i], crewUsers[i]]);

// --- Clients (fictional sample accounts)
const C = [
  ["client@shoalcreek.test", "Sample Property Group", "Jordan Rivera", "property_management", "2100 S Lamar Blvd, Austin, TX", 30.2465, -97.7795],
  ["retail@shoalcreek.test", "Northgate Retail Commons (sample)", "Casey Nguyen", "retail_center", "2701 S I-35 Frontage Rd, Round Rock, TX", 30.4846, -97.6747],
  ["hoa@shoalcreek.test", "Cedar Hollow HOA (sample)", "Morgan Patel", "hoa", "1400 Cypress Creek Rd, Cedar Park, TX", 30.4836, -97.8302],
  ["cafe@shoalcreek.test", "Pecan Street Cafe (sample)", "Riley Brooks", "restaurant", "100 E Pecan St, Pflugerville, TX", 30.4394, -97.6200],
  ["home@shoalcreek.test", null, "Taylor Kim", "residential", "4500 Shoal Creek Blvd, Austin, TX", 30.3156, -97.7487],
] as const;
const clients: string[] = [];
for (const [email, company, name, segment, address, lat, lng] of C) {
  const uid = await user(email, name, "client");
  clients.push(await ins("INSERT INTO clients (user_id,company,contact_name,email,segment,address,lat,lng,phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'512-555-0142')", [uid, company, name, email, segment, address, lat, lng]));
}

// --- Jobs: history, this week, and an unassigned backlog for the planner
const at = "(date_trunc('day', now() AT TIME ZONE 'America/Chicago') + make_interval(days => $1::int, hours => $2::int)) AT TIME ZONE 'America/Chicago'";
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
const jobIds: string[] = [];
for (const [ci, cr, day, hour, title, service, minutes, price, status, freq = "one_time", size = 2, equip = ["hot-water unit", "surface cleaner"], dLat = 0, dLng = 0] of J) {
  const c = C[ci];
  const id = (await db.query(
    `INSERT INTO jobs (client_id,crew_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,actual_minutes,crew_size,equipment,frequency,price_cents,status,clock_in,clock_out)
     VALUES ($3,$4,$5,$6,$7,$8,$9,${at},$10,$11,$12,$13,$14,$15,$16::job_status,
       CASE WHEN $16 IN ('in_progress','completed') THEN ${at} END,
       CASE WHEN $16 = 'completed' THEN ${at} + make_interval(mins => $11::int) END) RETURNING id`,
    [day, hour, clients[ci], cr === null ? null : crews[cr], title, service, c[4], c[5] + dLat, c[6] + dLng, minutes,
     status === "completed" ? Math.round(minutes * (0.9 + ((title.length % 5) * 0.06))) : null, size, equip, freq, price * 100, status],
  )).rows[0].id as string;
  jobIds.push(id);
  if (status === "completed") {
    const svg = (label: string, a: string, b: string) =>
      "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400'><defs><linearGradient id='g' x2='1' y2='1'><stop stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='640' height='400' fill='url(#g)'/><text x='24' y='376' font-family='sans-serif' font-size='28' fill='white'>${label} · sample photo</text></svg>`);
    await db.query("INSERT INTO job_photos (job_id,kind,data_url,taken_by) VALUES ($1,'before',$2,$4),($1,'after',$3,$4)",
      [id, svg("Before", "#3f3a2e", "#1d1b16"), svg("After", "#cbd5e1", "#94a3b8"), crewUsers[cr ?? 0]]);
    const paid = day < -10;
    await db.query(
      `INSERT INTO invoices (client_id,job_id,description,amount_cents,status,due_date,paid_at,payment_method)
       VALUES ($1,$2,$3,$4,$5,(now() + make_interval(days => $6::int))::date,$7,$8)`,
      [clients[ci], id, title, price * 100, paid ? "paid" : "open", day + 15, paid ? new Date(Date.now() + (day + 2) * 864e5) : null, paid ? "Visa •••• 4242" : null],
    );
  }
}
await db.query("INSERT INTO payment_methods (client_id,kind,label,is_default) VALUES ($1,'card','Visa •••• 4242',true),($1,'ach','Business checking •••• 6789',false)", [clients[0]]);

// --- CRM leads
const L: [string, string, string, string, string, number, string, number, number][] = [
  ["Avery Coleman", "Sample Office Park", "office_park", "Austin", "new", 1800000, "website", 30.4012, -97.7253],
  ["Drew Hamilton", "Riverside Multifamily (sample)", "multifamily", "Austin", "new", 950000, "referral", 30.2380, -97.7240],
  ["Sam Ortiz", "Brushy Creek HOA (sample)", "hoa", "Round Rock", "contacted", 640000, "door-to-door", 30.5110, -97.7300],
  ["Jamie Lee", "Main St Bakery (sample)", "storefront", "Round Rock", "contacted", 120000, "instagram", 30.5083, -97.6789],
  ["Quinn Foster", "Sample Asset Partners", "property_management", "Austin", "quoted", 4200000, "linkedin", 30.2672, -97.7431],
  ["Reese Walker", "Pflugerville Plaza (sample)", "retail_center", "Pflugerville", "quoted", 1450000, "cold email", 30.4560, -97.6100],
  ["Parker Diaz", "Taco Spot #3 (sample)", "restaurant", "Cedar Park", "won", 380000, "website", 30.5200, -97.8100],
  ["Emerson Hall", "Sample Property Group", "property_management", "Austin", "retained", 2800000, "referral", 30.2465, -97.7795],
  ["Rowan Price", "Lakeview Townhomes (sample)", "hoa", "Cedar Park", "lost", 300000, "website", 30.4950, -97.8500],
  ["Hayden Brooks", "Sample Dental Studio", "storefront", "Austin", "new", 90000, "google", 30.3500, -97.7350],
];
for (const [name, company, segment, city, stage, value, source, lat, lng] of L)
  await db.query("INSERT INTO leads (name,company,email,segment,city,stage,value_cents,source,lat,lng) VALUES ($1,$2,$3,$4,$5,$6::lead_stage,$7,$8,$9,$10)",
    [name, company, name.split(" ")[0].toLowerCase() + "@example.com", segment, city, stage, value, source, lat, lng]);

// --- Service zones ([lat,lng] polygons, approximate)
const Z: [string, string, number, number[][], string][] = [
  ["Austin Core", "#22d3ee", 1, [[30.36, -97.80], [30.36, -97.68], [30.22, -97.68], [30.20, -97.80], [30.26, -97.84]], "Downtown, Domain-to-SoCo corridor"],
  ["North Metro — Round Rock / Pflugerville", "#a3e635", 1, [[30.56, -97.72], [30.56, -97.57], [30.40, -97.57], [30.38, -97.68], [30.42, -97.74]], "I-35 / SH-130 retail and multifamily"],
  ["Cedar Park / Leander", "#f472b6", 1, [[30.60, -97.90], [30.60, -97.78], [30.46, -97.76], [30.44, -97.86]], "183A corridor, HOAs"],
  ["Georgetown (Phase 2)", "#fbbf24", 2, [[30.70, -97.74], [30.70, -97.62], [30.58, -97.62], [30.58, -97.74]], "Expansion after 3rd crew"],
  ["Buda / Kyle (Phase 2)", "#fbbf24", 2, [[30.12, -97.90], [30.12, -97.78], [29.96, -97.78], [29.96, -97.90]], "Expansion — residential growth"],
];
for (const [name, color, phase, poly, notes] of Z)
  await db.query("INSERT INTO service_zones (name,color,phase,polygon,notes) VALUES ($1,$2,$3,$4,$5)", [name, color, phase, JSON.stringify(poly), notes]);

// --- Map intelligence (anonymized placeholders — replace with field research)
const M: [string, string, number, number, number, number, string][] = [
  ["competitor", "Regional vendor cluster A", 30.39, -97.73, 4000, 3, "Est. 3 operators; commercial focus"],
  ["competitor", "Franchise operator B", 30.50, -97.68, 3500, 2, "Residential-heavy, weekend availability"],
  ["competitor", "Owner-operator cluster C", 30.25, -97.76, 3000, 4, "Low price, no after-hours"],
  ["competitor", "Regional vendor D", 30.47, -97.82, 3000, 1, "HOA contracts"],
  ["hotspot", "Domain / North Burnet retail + office", 30.4021, -97.7253, 2200, 0.95, "High-density Class A retail"],
  ["hotspot", "Downtown CBD", 30.2672, -97.7431, 2000, 0.9, "Office towers, plazas, garages"],
  ["hotspot", "I-35 Round Rock retail corridor", 30.4846, -97.6747, 2600, 0.85, "Big-box + strip centers"],
  ["hotspot", "Parmer Ln tech campuses", 30.4170, -97.6950, 2400, 0.75, "Office parks, garages"],
  ["hotspot", "183A Cedar Park commercial", 30.4836, -97.8302, 2200, 0.7, "Strip centers, restaurants"],
  ["hotspot", "SH-130 Pflugerville growth", 30.4560, -97.6100, 2400, 0.6, "New retail + multifamily"],
  ["hotspot", "South Lamar / SoCo", 30.2465, -97.7600, 1800, 0.8, "Restaurants + storefronts"],
  ["pricing", "Avg flatwork $0.22/sqft", 30.30, -97.75, 6000, 0.22, "Benchmark estimate"],
  ["pricing", "Avg flatwork $0.17/sqft", 30.49, -97.68, 6000, 0.17, "Benchmark estimate"],
  ["pricing", "Avg flatwork $0.19/sqft", 30.49, -97.82, 5000, 0.19, "Benchmark estimate"],
];
for (const m of M) await db.query("INSERT INTO map_markers (layer,label,lat,lng,radius_m,value,notes) VALUES ($1,$2,$3,$4,$5,$6,$7)", m);

// --- Campaigns
await db.query(`INSERT INTO campaigns (name,subject,body,audience,status,recipient_count,sent_at) VALUES
 ('Fall reset — commercial','Post-summer grime? Get a fall reset for {{company}}','Hi {{first_name}},\n\nSummer left its mark. Book a fall flatwork reset this month and save 10%.\n\n— Shoal Creek Clean','commercial','sent',6, now() - interval '9 days'),
 ('Holiday storefront prep','Make {{company}} shine for holiday shoppers','Hi {{first_name}},\n\nHoliday traffic is coming. We''ll wash your storefront overnight so you never lose a trading hour.\n\n— Shoal Creek Clean','storefront','draft',0,NULL)`);
await db.query(`INSERT INTO email_outbox (to_email,subject,body,kind) VALUES ('client@shoalcreek.test','Your job is complete — photos inside','Your recent service is complete. View before/after photos in your client portal.','transactional')`);

console.log(`seeded: ${crews.length} crews, ${clients.length} clients, ${jobIds.length} jobs, ${L.length} leads, ${Z.length} zones`);
await db.end();
