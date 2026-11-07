import { test } from "node:test";
import assert from "node:assert/strict";
import { extractFacts, extractPeople, robotsAllows, decodeCfEmail, normalizePhone, extractOrgNames, dedupeKey } from "../leadfinder/src/parse.ts";
import { mapElement, overpassQuery } from "../leadfinder/src/osm.ts";
import { fitScore } from "../lib/fit.ts";
import { generateBrief } from "../lib/brief.ts";

const HTML = `<html><head><meta name="description" content="Family-owned Tex-Mex on South Lamar since 1998."><script>var x="fake@sentry.io"</script></head>
<body><nav><a href="/about-us">About</a> <a href="/contact">Contact Us</a> <a href="https://other.com/contact">elsewhere</a>
<a href="https://www.facebook.com/taqueria">fb</a></nav>
<p>Call us: (512) 444-1234 · <a href="tel:+15124449876">order line</a></p>
<p>Email <a href="mailto:hello@taqueriaejemplo.com?subject=hi">hello@taqueriaejemplo.com</a> or catering at
<span class="__cf_email__" data-cfemail="8feceefbeafde6e1e8cffbeefefaeafde6eeeae5eae2ffe3e0a1ece0e2">[email&#160;protected]</span></p>
<img src="logo@2x.png"><div><h3>Maria Gonzalez</h3><p>General Manager</p></div>
<p>Owner: David Chen</p></body></html>`;

test("extracts published contacts and same-site contact/about links", () => {
  const f = extractFacts(HTML, "https://www.taqueriaejemplo.com/");
  assert.deepEqual(f.emails.map((e) => e.value), ["hello@taqueriaejemplo.com", "catering@taqueriaejemplo.com"]);
  assert.deepEqual(f.phones.map((p) => p.value), ["+15124449876", "+15124441234"]);
  assert.deepEqual(f.people.map((p) => `${p.name}|${p.title}`).sort(), ["David Chen|Owner", "Maria Gonzalez|General Manager"]);
  assert.deepEqual(f.links, ["https://www.taqueriaejemplo.com/about-us", "https://www.taqueriaejemplo.com/contact"]);
  assert.equal(f.socials[0], "https://www.facebook.com/taqueria");
  assert.match(f.description!, /South Lamar/);
  assert.ok(f.emails.every((e) => e.source === "https://www.taqueriaejemplo.com/"));
});
test("Cloudflare email decoding, phone normalization", () => {
  assert.equal(decodeCfEmail("8feceefbeafde6e1e8cffbeefefaeafde6eeeae5eae2ffe3e0a1ece0e2"), "catering@taqueriaejemplo.com");
  assert.equal(normalizePhone("512.444.1234"), "+15124441234");
  assert.equal(normalizePhone("1 (512) 444-1234"), "+15124441234");
  assert.equal(normalizePhone("000-000-0000"), null);
  assert.equal(normalizePhone("512-555-0100"), null); // fictional 555-01xx
});
test("people extraction ignores non-names", () => {
  assert.deepEqual(extractPeople("Contact Us, Owner\nJordan Lee - Property Manager", "x").map((p) => p.name), ["Jordan Lee"]);
});
test("robots.txt rules", () => {
  const r = "User-agent: *\nDisallow: /private\nAllow: /private/ok\n\nUser-agent: ShoalCreekCleanLeadFinder\nDisallow: /";
  assert.equal(robotsAllows(r, "/contact"), false); // our agent group wins
  const r2 = "User-agent: *\nDisallow: /private\nAllow: /private/ok";
  assert.equal(robotsAllows(r2, "/contact"), true);
  assert.equal(robotsAllows(r2, "/private/x"), false);
  assert.equal(robotsAllows(r2, "/private/ok/page"), true);
  assert.equal(robotsAllows("", "/"), true);
});
test("competitor page org-name candidates", () => {
  const names = extractOrgNames("We washed the breezeways at Riverside Oaks Apartments and the plaza at Brushy Creek Shopping Center. Our team loved it.").map((o) => o.name);
  assert.ok(names.includes("Riverside Oaks Apartments"));
  assert.ok(names.includes("Brushy Creek Shopping Center"));
});
test("OSM mapping + query", () => {
  const c = mapElement({ type: "node", id: 42, lat: 30.25, lon: -97.76, tags: { name: "Taco Spot", amenity: "fast_food", website: "tacospot.com", phone: "+1 512 444 1234", "addr:housenumber": "100", "addr:street": "S Lamar Blvd" } }, "restaurant")!;
  assert.equal(c.website, "https://tacospot.com");
  assert.equal(c.city, "Austin");
  assert.match(c.category, /drive-thru/);
  assert.match(overpassQuery("restaurant"), /amenity.*restaurant\|fast_food\|cafe/);
  assert.equal(dedupeKey("https://www.TacoSpot.com/menu", "x", "y"), "tacospot.com");
});
test("fit score + brief", () => {
  const zone = { name: "Austin Core", phase: 1, polygon: [[30.36, -97.8], [30.36, -97.68], [30.22, -97.68], [30.2, -97.8]] };
  const hi = fitScore({ segment: "property_management", lat: 30.27, lng: -97.74, emails: [1], phones: [1], people: [{ title: "Property Manager" }], website: "x", competitor: "Hi-Tech" }, [zone]);
  const lo = fitScore({ segment: "residential", lat: 31, lng: -98 }, [zone]);
  assert.equal(hi.score, 100);
  assert.ok(lo.score < 10);
  const b = generateBrief({ company: "Riverside Oaks Apartments", segment: "multifamily", city: "Austin", contactName: "Jordan Lee", contactTitle: "Community Manager", competitor: "Clean Green", hasPhone: true });
  assert.equal(b.channel, "call");
  assert.match(b.opener, /^Hi Jordan/);
  assert.match(b.opener, /left 9-to-5 tech jobs/);
  assert.match(b.goal, /test area/);
  assert.ok(b.compliance.some((c) => /disparage/.test(c)));
  assert.match(b.email.body, /Austin/);
});
