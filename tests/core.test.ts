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
