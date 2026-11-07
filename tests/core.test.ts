import { test } from "node:test";
import assert from "node:assert/strict";
import { computeQuote } from "../lib/pricing.ts";
import { allocate, haversineKm, inPolygon, optimizeRoute } from "../lib/geo.ts";
import { generateStrategy } from "../lib/strategy.ts";

const base = { property: "commercial" as const, stories: "1" as const, soil: "moderate" as const, frequency: "one_time" as const };

test("flatwork priced at $0.18/sqft", () => {
  const r = computeQuote({ ...base, items: [{ service: "flatwork", quantity: 10000, surface: "concrete" }] });
  assert.equal(r.total_cents, 180000);
  assert.equal(r.needs_review, false);
});
test("minimum charge applies", () => {
  const r = computeQuote({ ...base, items: [{ service: "flatwork", quantity: 100, surface: "concrete" }] });
  assert.equal(r.total_cents, 25000);
  assert.equal(r.line_items[0].note, "minimum charge");
});
test("height multiplies vertical work only; quarterly discount", () => {
  const r = computeQuote({ ...base, stories: "2", frequency: "quarterly", items: [{ service: "softwash", quantity: 4000, surface: "siding" }, { service: "flatwork", quantity: 5000, surface: "concrete" }] });
  assert.equal(r.line_items[0].amount_cents, 140000); // 4000 * .28 * 1.25
  assert.equal(r.line_items[1].amount_cents, 90000);
  assert.equal(r.discount_cents, Math.round(230000 * 0.15));
});
test("4+ stories adds lift fee and routes to review", () => {
  const r = computeQuote({ ...base, stories: "4", items: [{ service: "softwash", quantity: 2000, surface: "stucco" }] });
  assert.ok(r.line_items.some((l) => l.service === "lift"));
  assert.equal(r.needs_review, true);
});
test("large quotes route to review", () => {
  assert.equal(computeQuote({ ...base, items: [{ service: "flatwork", quantity: 60000, surface: "concrete" }] }).needs_review, true);
});
test("haversine Austin → Round Rock ≈ 28 km", () => {
  const d = haversineKm({ lat: 30.2672, lng: -97.7431 }, { lat: 30.5083, lng: -97.6789 });
  assert.ok(d > 25 && d < 30, String(d));
});
test("route optimizer visits nearest first", () => {
  const order = optimizeRoute({ lat: 30, lng: -97 }, [{ lat: 30.3, lng: -97 }, { lat: 30.1, lng: -97 }, { lat: 30.2, lng: -97 }]);
  assert.deepEqual(order, [1, 2, 0]);
});
test("point in polygon", () => {
  const sq = [[0, 0], [0, 1], [1, 1], [1, 0]];
  assert.equal(inPolygon({ lat: 0.5, lng: 0.5 }, sq), true);
  assert.equal(inPolygon({ lat: 1.5, lng: 0.5 }, sq), false);
});
test("allocator respects crew size and equipment", () => {
  const crews = [
    { id: "a", name: "A", size: 2, equipment: ["surface cleaner"], home_lat: 30, home_lng: -97, booked_minutes: 0 },
    { id: "b", name: "B", size: 3, equipment: ["surface cleaner", "gutter vac"], home_lat: 31, home_lng: -97, booked_minutes: 0 },
  ];
  const res = allocate([
    { id: "j1", lat: 30, lng: -97, quoted_minutes: 120, crew_size: 3, equipment: [], service: "flatwork" },
    { id: "j2", lat: 30, lng: -97, quoted_minutes: 60, crew_size: 1, equipment: ["gutter vac"], service: "gutter" },
    { id: "j3", lat: 30, lng: -97, quoted_minutes: 60, crew_size: 1, equipment: ["boom lift"], service: "roof" },
  ], crews);
  const m = Object.fromEntries(res.map((a) => [a.job_id, a.crew_id]));
  assert.equal(m.j1, "b");
  assert.equal(m.j2, "b");
  assert.equal(m.j3, null);
});
test("strategy generator tailors by segment", () => {
  const s = generateStrategy({ segment: "hoa", size: "small", city: "Cedar Park", month: 3 });
  assert.match(s.headline, /Cedar Park/);
  assert.match(s.email.subject, /Pollen/);
  assert.match(s.decisionMaker, /HOA/);
});

import { benchmark, position, sayDoGap } from "../lib/market.ts";
const comps = [
  { slug: "a", name: "A", services_claimed: ["driveway", "roof", "gutter"], services_evidenced: ["driveway"], prices: [{ service: "driveway", low: 0.2, high: null, unit: "sqft" }, { service: "driveway", low: 150, high: null, unit: "job" }] },
  { slug: "b", name: "B", services_claimed: ["driveway"], services_evidenced: ["driveway"], prices: [{ service: "driveway", low: 0.25, high: 0.35, unit: "sqft" }] },
];
test("market benchmark separates per-unit from job minimums", () => {
  const b = benchmark("driveway", "sqft", comps);
  assert.deepEqual(b.perUnit, { low: 0.2, median: 0.25, high: 0.3, n: 2 });
  assert.equal(b.jobMinimums?.low, 150);
  assert.equal(position(0.22, b.perUnit), "under median");
  assert.equal(position(0.4, b.perUnit), "above market");
});
test("logged quotes feed the benchmark", () => {
  const b = benchmark("softwash", "sqft", [], [{ service: "softwash_house", perUnit: 0.2, competitor: "X" }]);
  assert.equal(b.perUnit?.n, 1);
});
test("say/do gap", () => assert.equal(Math.round(sayDoGap(comps[0]) * 100), 67));

import { ctToUtc, ctDate, ctClock, ctDayBounds, weekStart } from "../lib/tz.ts";
test("Central time ↔ UTC across DST", () => {
  assert.equal(ctToUtc("2026-11-07", "08:00"), "2026-11-07T14:00:00.000Z"); // CST (UTC−6)
  assert.equal(ctToUtc("2026-07-01", "08:00"), "2026-07-01T13:00:00.000Z"); // CDT (UTC−5)
  assert.equal(ctToUtc("2026-03-08", "12:00"), "2026-03-08T17:00:00.000Z"); // DST starts 2am that day
  assert.equal(ctDate("2026-11-08T05:59:00.000Z"), "2026-11-07");
  assert.equal(ctClock("2026-11-07T14:00:00.000Z"), "08:00");
  assert.deepEqual(ctDayBounds("2026-11-01"), ["2026-11-01T05:00:00.000Z", "2026-11-02T06:00:00.000Z"]); // 25-hour fall-back day
  assert.equal(weekStart("2026-11-07"), "2026-11-02");
});

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { buildSetupSql, lit } from "../lib/setup.ts";
test("seed SQL runs on SQLite and is idempotent for non-seed setup", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  const schemaSql = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  const competitors = JSON.parse(readFileSync(new URL("../data/competitors.json", import.meta.url), "utf8")).competitors;
  db.exec(buildSetupSql({ schemaSql, competitors, seed: true, passwordHash: "x", now: new Date("2026-11-07T18:00:00Z") }));
  db.exec(buildSetupSql({ schemaSql, competitors })); // re-running setup must not fail or duplicate
  const n = (t: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n;
  assert.equal(n("competitors"), competitors.length);
  assert.equal(n("jobs"), 17);
  assert.equal(n("users"), 11);
  assert.equal(n("pricing_rules"), 7);
  db.exec("INSERT INTO invoices (client_id, description, amount_cents) SELECT id, 'x', 1 FROM clients LIMIT 1");
  assert.equal((db.prepare("SELECT MAX(number) AS m FROM invoices").get() as { m: number }).m, n("invoices")); // trigger numbers new invoices
  assert.equal(lit("O'Brien"), "'O''Brien'");
});
