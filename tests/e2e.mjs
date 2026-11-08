// End-to-end smoke test across all three tiers. Usage: BASE=http://localhost:3000 node tests/e2e.mjs [screenshotDir]
// Requires a freshly seeded DB (npm run db:seed) and ALPHA_MODE=true.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // resolves via NODE_PATH or local install

const BASE = process.env.BASE ?? "http://localhost:3000";
const shots = process.argv[2];
const browser = await chromium.launch();
const errors = [];
const step = async (name, fn) => {
  try { await fn(); console.log("✓", name); } catch (e) { errors.push(name); console.log("✗", name, "—", (e.message.split("\n").filter((l) => /waitFor|locator|waiting for|Timeout|Error/.test(l)).slice(0, 3).join(" ⏎ ") || e.message.split("\n")[0])); }
};
async function session(email) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  if (email) {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState("networkidle");
    await page.fill('input[type=email]', email);
    await page.fill('input[type=password]', "alpha2026!");
    await page.click('button:has-text("Sign in")');
    await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  }
  return page;
}
const snap = (page, n) => shots && page.screenshot({ path: `${shots}/${n}.png`, fullPage: false });

// ---- Public: landing + quote + booking
let portalLink;
await step("landing renders + before/after slider", async () => {
  const p = await session();
  await p.goto(BASE);
  await p.getByText("photo-verified.").waitFor();
  await p.locator('[role=slider]').first().click({ position: { x: 50, y: 50 } });
  await snap(p, "01-landing");
  await p.context().close();
});
await step("quote wizard → instant estimate → book", async () => {
  const p = await session();
  await p.goto(`${BASE}/quote?type=commercial`);
  await p.click('button:has-text("Continue")');
  await p.locator('input[type=number]').first().fill("8000");
  await p.click('button:has-text("Continue")');
  await p.getByText("Your name").locator("..").locator("input").fill("E2E Tester");
  await p.locator('input[type=email]').fill(`e2e${Date.now()}@example.com`);
  await p.fill('input[placeholder="Company name"]', "E2E Rival Wash");
  await p.fill('input[placeholder="Their price $"]', "1300");
  await snap(p, "02-quote-details");
  await p.click('button:has-text("Get my quote")');
  await p.getByText("Your instant estimate").waitFor();
  await p.click('button:has-text("Book this service")');
  const link = p.locator('a:has-text("Open client portal")');
  await link.waitFor();
  portalLink = await link.getAttribute("href");
  await snap(p, "03-quote-booked");
  await p.goto(portalLink);
  await p.waitForURL(/\/client/);
  await p.getByText("Upcoming & live").waitFor();
  await p.context().close();
});
await step("large quote routes to manual review", async () => {
  // Sent from inside the page (browser network stack, honors proxies) — Node-side fetch can't reach external hosts in some sandboxes.
  const p = await session();
  await p.goto(BASE);
  const d = await p.evaluate(() => fetch("/api/quote", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Big Co", email: "big@example.com", property: "commercial", stories: "1", soil: "heavy", frequency: "one_time", items: [{ service: "flatwork", quantity: 80000, surface: "concrete" }] }) }).then((r) => r.json()));
  await p.context().close();
  if (!d.needs_review) throw new Error("expected review");
});

// ---- Admin
const admin = await session("ops@shoalcreek.test");
await step("admin overview + approve review quote", async () => {
  await admin.getByText("Operations overview").waitFor();
  await admin.click('button:has-text("Approve & send")');
  await admin.waitForTimeout(800);
  await snap(admin, "04-admin-overview");
});
await step("dispatch board drag & drop persists", async () => {
  // The seeded job is "tomorrow" (Central time): open the board for the week containing it.
  const tomorrowCT = new Date(Date.now() + 864e5).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  await admin.goto(`${BASE}/admin/dispatch?week=${tomorrowCT}`);
  const card = admin.locator('[draggable=true]', { hasText: "Courtyard pavers" }).first();
  await card.waitFor();
  const target = admin.locator(".contents").filter({ hasText: "Crew Bravo" }).locator("> div").nth(3);
  await Promise.all([
    admin.waitForResponse((r) => r.url().includes("/api/admin/jobs/") && r.request().method() === "PATCH" && r.ok()),
    card.dragTo(target),
  ]);
  await admin.reload();
  const inBravo = await admin.locator(".contents").filter({ hasText: "Crew Bravo" }).getByText("Courtyard pavers").count();
  if (!inBravo) throw new Error("job did not move to Crew Bravo");
  await snap(admin, "05-dispatch");
});
await step("resource planner proposes + applies", async () => {
  await admin.goto(`${BASE}/admin/planner`);
  await admin.getByText("Proposed assignments").waitFor();
  await snap(admin, "06-planner");
  await admin.click('button:has-text("Apply plan")');
  await admin.getByText(/Assigned \d+/).waitFor();
});
await step("map renders tiles, zones and draws a zone", async () => {
  await admin.goto(`${BASE}/admin/map`);
  await admin.locator(".leaflet-container").waitFor();
  await admin.waitForTimeout(1500);
  if ((await admin.locator("path.leaflet-interactive").count()) < 5) throw new Error("zones/markers missing");
  await admin.click('button:has-text("Draw zone")');
  const box = await admin.locator(".leaflet-container").boundingBox();
  for (const [dx, dy] of [[300, 300], [420, 300], [420, 420]]) await admin.mouse.click(box.x + dx, box.y + dy);
  await admin.fill('input[placeholder="Zone name"]', "E2E Zone");
  await admin.click('button:has-text("Save zone")');
  await admin.waitForTimeout(1000);
  await admin.click('button:has-text("route")');
  await snap(admin, "07-map");
});
await step("CRM pipeline drag", async () => {
  await admin.goto(`${BASE}/admin/crm`);
  const card = admin.locator("[draggable=true]", { hasText: "Sample Office Park" });
  // Wait for the stage PATCH itself (a fixed sleep raced the save on cold starts).
  await Promise.all([
    admin.waitForResponse((r) => r.url().includes("/api/admin/leads/") && r.request().method() === "PATCH" && r.ok()),
    // Drop on the column header: it stays on screen even when a long "New" column forces a scroll.
    card.dragTo(admin.locator(".glass", { hasText: "Contacted" }).first(), { targetPosition: { x: 100, y: 24 } }),
  ]);
  await admin.reload();
  if (!(await admin.locator(".glass", { hasText: "Contacted" }).first().getByText("Sample Office Park").count())) throw new Error("lead not moved");
  await snap(admin, "08-crm");
});
await step("strategy → campaign → send → outbox", async () => {
  await admin.goto(`${BASE}/admin/strategy`);
  await admin.click('a:has-text("Use as campaign")');
  await admin.waitForURL(/campaigns/);
  await admin.click('button:has-text("Save draft")');
  await admin.getByText("Draft saved").waitFor();
  admin.on("dialog", (d) => d.accept()); // confirm + alert
  await admin.locator('button:has-text("Send now")').first().click();
  await admin.waitForTimeout(1500);
  await admin.goto(`${BASE}/admin/outbox`);
  if (!(await admin.getByText("campaign").count())) throw new Error("no campaign emails in outbox");
  await snap(admin, "09-outbox");
});
await step("campaign emails carry CAN-SPAM footer + working unsubscribe", async () => {
  await admin.goto(`${BASE}/admin/outbox`);
  const item = admin.locator("details", { hasText: "campaign" }).first();
  await item.locator("summary").click();
  const body = await item.locator("pre").textContent();
  const link = body.match(/Unsubscribe in one click: (\S+)/)?.[1];
  if (!link) throw new Error("no unsubscribe link in campaign email");
  const u = new URL(link);
  await admin.goto(`${BASE}${u.pathname}${u.search}`);
  await admin.getByText("You're unsubscribed").waitFor();
  await admin.goto(`${BASE}/u?e=${encodeURIComponent(u.searchParams.get("e"))}&t=forged`);
  await admin.getByText("Link not valid").waitFor();
});
await step("lead finder: competitor sighting → brief → do not contact", async () => {
  await admin.goto(`${BASE}/admin/leads`);
  await admin.getByText("Log a competitor sighting").waitFor();
  await admin.waitForLoadState("networkidle");
  await admin.fill('input[placeholder="Business / property name"]', "E2E Oak Hollow Plaza");
  await admin.fill('input[placeholder^="What you saw"]', "branded truck in the lot at 6am");
  await admin.click('button:has-text("Log sighting")');
  await admin.waitForURL(/\/admin\/leads\/[0-9a-f-]{36}$/);
  await admin.getByText("Goal for this conversation").waitFor();
  await admin.getByText(/free side-by-side test area/).first().waitFor();
  await admin.getByText(/left 9-to-5 tech jobs/).first().waitFor();
  await admin.getByText(/Never disparage the competitor/).waitFor();
  await admin.getByText(/Hi-Tech Power Wash seen working here/).waitFor();
  await snap(admin, "14-lead-brief");
  await admin.waitForLoadState("networkidle"); // hydrated, so the button's handler is attached
  await admin.click('button:has-text("Do not contact")'); // confirm() auto-accepted by the dialog handler above
  await admin.getByText(/Do Not Contact:/).waitFor();
});
await step("price book edit", async () => {
  await admin.goto(`${BASE}/admin/pricing`);
  await admin.getByText("Service rates").waitFor();
});
await step("competitor intel: real data + price-match quote captured", async () => {
  await admin.goto(`${BASE}/admin/competitors`);
  await admin.getByText("Our price book vs. published market prices").waitFor();
  await admin.getByRole("link", { name: /Hi-Tech Power Wash/ }).waitFor();
  await admin.getByText(/E2E Rival Wash · flatwork · 8,000 sqft/).waitFor(); // from the quote wizard's price-match field
  await snap(admin, "13-competitors");
});

// ---- Field crew (mobile)
await step("field: en route → clock in → photos → complete", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login`);
  await p.fill("input[type=email]", "bravo@shoalcreek.test");
  await p.fill("input[type=password]", "alpha2026!");
  await p.click('button:has-text("Sign in")');
  await p.waitForURL(/\/field/);
  const job = p.locator(".glass", { hasText: "Dumpster pad degrease" });
  await job.getByRole("button", { name: /Arrived/ }).click();
  await job.getByRole("button", { name: /Complete/ }).waitFor();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  await job.locator('input[type=file]').nth(0).setInputFiles({ name: "b.png", mimeType: "image/png", buffer: png });
  await job.getByText("Before photos (1)").waitFor();
  await job.locator('input[type=file]').nth(1).setInputFiles({ name: "a.png", mimeType: "image/png", buffer: png });
  await job.getByText("After photos (1)").waitFor();
  await snap(p, "10-field");
  await job.getByRole("button", { name: /Complete/ }).click();
  await job.getByText("completed").waitFor();
  await ctx.close();
});

// ---- Client portal + billing
await step("client: dashboard, save card, pay invoice, receipt", async () => {
  const p = await session("cafe@shoalcreek.test");
  await p.getByText("Job history & photo proof").waitFor();
  await snap(p, "11-client");
  await p.goto(`${BASE}/client/billing`);
  await p.waitForLoadState("networkidle"); // let React hydrate before typing into controlled inputs
  await p.fill('input[placeholder^="Card number"]', "4242 4242 4242 4242");
  await p.click('button:has-text("Save card")');
  await p.locator("li", { hasText: "Visa •••• 4242" }).waitFor();
  await p.locator('button:has-text("Pay")').first().click();
  await p.locator("tr", { hasText: "Dumpster pad degrease" }).getByText("paid", { exact: true }).waitFor(); // invoice created by the field step
  await p.locator('a:has-text("Receipt")').first().click();
  await p.getByText("RECEIPT", { exact: true }).waitFor();
  await snap(p, "12-receipt");
  await p.context().close();
});
await step("authz: client cannot hit admin API", async () => {
  const p = await session("home@shoalcreek.test");
  const status = await p.evaluate(() => fetch("/api/admin/leads", { method: "POST", body: "{}" }).then((r) => r.status));
  if (status !== 403) throw new Error(`expected 403 got ${status}`);
  await p.context().close();
});

await browser.close();
console.log(errors.length ? `\nFAILED: ${errors.join(" | ")}` : "\nAll E2E checks passed");
process.exit(errors.length ? 1 : 0);
