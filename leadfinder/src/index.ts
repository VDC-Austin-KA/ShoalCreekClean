// Shoal Creek Clean lead finder — a separate Cloudflare Worker that runs on a schedule, outside the app.
// 1. discover: named businesses in target segments from OpenStreetMap (Overpass API)
// 2. competitor: business names in competitors' own public testimonial / gallery pages (flagged for review)
// 3. enrich: each business's own website (robots.txt honored) → published emails/phones/people
// Then scores fit and writes a call/email brief. Results land in the shared D1 database (CRM → Lead finder).
// Free-plan budget per run: ≤ 40 outbound fetches and ≤ ~45 D1 queries.
import { extractFacts, extractOrgNames, htmlToText, normalizePhone, robotsAllows, dedupeKey, type Found, type Person } from "./parse.ts";
import { mapElement, overpassQuery, SEGMENT_QUERIES, type OsmElement } from "./osm.ts";
import { fitScore, type Zone } from "../../lib/fit.ts";
import { generateBrief } from "../../lib/brief.ts";

type D1 = { prepare(sql: string): { bind(...v: unknown[]): { all<T = any>(): Promise<{ results: T[] }>; run(): Promise<unknown>; first<T = any>(): Promise<T | null> } } };
type Env = { DB: D1; FINDER_KEY?: string; OVERPASS_URL?: string };
const UA = "ShoalCreekCleanLeadFinder/1.0 (+https://wash.ackerworks.com/bot)";
const FETCH_BUDGET = 40, ENRICH_PER_RUN = 6;
// Ordered by what answers from Cloudflare's network (probed 2026-11-08): the mail.ru mirror works; the others mostly refuse Workers.
const OVERPASS_MIRRORS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const q = <T = any>(env: Env, sql: string, ...v: unknown[]) => env.DB.prepare(sql).bind(...v).all<T>().then((r) => r.results);
const run = (env: Env, sql: string, ...v: unknown[]) => env.DB.prepare(sql).bind(...v).run();

function budgeted() {
  let left = FETCH_BUDGET;
  return {
    get left() { return left; },
    async get(url: string, init: RequestInit = {}, timeoutMs = 10_000) {
      if (left-- <= 0) throw new Error("fetch budget exhausted");
      return fetch(url, { ...init, headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.5", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(timeoutMs), redirect: "follow" });
    },
  };
}
type Net = ReturnType<typeof budgeted>;

let lastPageError = "";
/** Site is dead, bot-protected or has no HTML homepage: record it, don't retry (and never try to get around a block). */
class Unreachable extends Error {}
async function pageHtml(net: Net, url: string): Promise<{ html: string; url: string } | null> {
  const r = await net.get(url);
  const type = r.headers.get("content-type") ?? "";
  if (!r.ok || !type.includes("html")) { lastPageError = `HTTP ${r.status} ${type.split(";")[0] || "no content-type"} at ${new URL(r.url || url).hostname}`; return null; }
  return { html: (await r.text()).slice(0, 400_000), url: r.url || url };
}

const SEGMENT_FROM_NAME: [RegExp, string][] = [
  [/apartments|townhomes|condo|villas|residences/i, "multifamily"], [/\bhoa\b|homeowners/i, "hoa"],
  [/plaza|center|commons|market|crossing|village/i, "retail_center"], [/properties|management|realty/i, "property_management"],
  [/restaurant|cafe|café|grill|kitchen|bar\b|brewery|taqueria|bakery|coffee/i, "restaurant"], [/office park|business park/i, "office_park"],
];

async function zonesOf(env: Env): Promise<Zone[]> {
  return (await q(env, "SELECT name, phase, polygon FROM service_zones")).map((z) => ({ ...z, polygon: JSON.parse(z.polygon) }));
}

function scoreAndBrief(lead: { company: string; segment: string; city: string | null; lat: number | null; lng: number | null; name?: string | null },
  intel: { emails: Found[]; phones: Found[]; people: Person[]; website: string | null; competitor: string | null; category?: string | null }, zones: Zone[]) {
  const fit = fitScore({ segment: lead.segment, lat: lead.lat, lng: lead.lng, emails: intel.emails, phones: intel.phones, people: intel.people, website: intel.website, competitor: intel.competitor }, zones);
  const top = intel.people[0];
  const brief = generateBrief({ company: lead.company, segment: lead.segment, city: lead.city, contactName: top?.name, contactTitle: top?.title, competitor: intel.competitor,
    category: intel.category, hasEmail: intel.emails.length > 0, hasPhone: intel.phones.length > 0 });
  return { fit, brief };
}

/** Insert new leads + intel rows (+ enrich jobs) in three bulk statements, skipping known businesses. */
async function insertCandidates(env: Env, rows: { lead: any; intel: any; enrich: boolean }[]) {
  if (!rows.length) return 0;
  const keys = rows.map((r) => r.intel.dedupe_key);
  const known = new Set((await q(env, "SELECT dedupe_key FROM lead_intel WHERE dedupe_key IN (SELECT value FROM json_each(?1))", JSON.stringify(keys))).map((r) => r.dedupe_key));
  const fresh = rows.filter((r, i) => !known.has(r.intel.dedupe_key) && keys.indexOf(r.intel.dedupe_key) === i);
  if (!fresh.length) return 0;
  await run(env, `INSERT INTO leads (id,name,company,email,phone,segment,city,stage,value_cents,source,notes,lat,lng)
    SELECT json_extract(value,'$.id'), json_extract(value,'$.name'), json_extract(value,'$.company'), json_extract(value,'$.email'), json_extract(value,'$.phone'),
      json_extract(value,'$.segment'), json_extract(value,'$.city'), 'new', 0, json_extract(value,'$.source'), json_extract(value,'$.notes'), json_extract(value,'$.lat'), json_extract(value,'$.lng')
    FROM json_each(?1)`, JSON.stringify(fresh.map((r) => r.lead)));
  await run(env, `INSERT INTO lead_intel (lead_id,dedupe_key,website,emails,phones,people,company_info,origin,origin_url,competitor,fit_score,fit_reasons,brief,status)
    SELECT json_extract(value,'$.lead_id'), json_extract(value,'$.dedupe_key'), json_extract(value,'$.website'), json_extract(value,'$.emails'), json_extract(value,'$.phones'),
      json_extract(value,'$.people'), json_extract(value,'$.company_info'), json_extract(value,'$.origin'), json_extract(value,'$.origin_url'), json_extract(value,'$.competitor'),
      json_extract(value,'$.fit_score'), json_extract(value,'$.fit_reasons'), json_extract(value,'$.brief'), json_extract(value,'$.status')
    FROM json_each(?1)`, JSON.stringify(fresh.map((r) => r.intel)));
  const enrich = fresh.filter((r) => r.enrich).map((r) => ({ lead_id: r.lead.id }));
  if (enrich.length) await run(env, "INSERT INTO finder_jobs (kind, payload) SELECT 'enrich', value FROM json_each(?1)", JSON.stringify(enrich));
  return fresh.length;
}

async function discover(env: Env, net: Net, segment: string, zones: Zone[]) {
  // Public Overpass mirrors; some refuse Cloudflare's egress, so fall through until one answers.
  const endpoints = env.OVERPASS_URL ? [env.OVERPASS_URL] : OVERPASS_MIRRORS;
  let r: Response | null = null;
  const errors: string[] = [];
  for (const ep of endpoints) {
    if (net.left < 6) break;
    try {
      r = await net.get(ep, { method: "POST", body: new URLSearchParams({ data: overpassQuery(segment) }), headers: { "content-type": "application/x-www-form-urlencoded" } }, 55_000);
      if (r.ok) break;
      errors.push(`${new URL(ep).hostname} ${r.status}`); r = null;
    } catch (e) { errors.push(`${new URL(ep).hostname} ${(e as Error).message}`); }
  }
  if (!r) throw new Error(`overpass: ${errors.join("; ")}`);
  const els = ((await r.json()) as { elements: OsmElement[] }).elements;
  const suppressed = new Set((await q(env, "SELECT contact FROM suppressions")).map((s) => s.contact));
  const rows = els.map((el) => mapElement(el, segment)).filter((c) => c !== null).map((c) => {
    const id = crypto.randomUUID(), osmUrl = `https://www.openstreetmap.org/${c.osmId}`;
    const phone = c.phone ? normalizePhone(c.phone) : null, email = c.email?.toLowerCase() ?? null;
    const intel = {
      emails: email && !suppressed.has(email) ? [{ value: email, source: osmUrl }] : [],
      phones: phone && !suppressed.has(phone) ? [{ value: phone, source: osmUrl }] : [],
      people: [] as Person[], website: c.website, competitor: null, category: c.category,
    };
    const lead = { id, name: c.name, company: c.name, email: intel.emails[0]?.value ?? null, phone: intel.phones[0]?.value ?? null, segment, city: c.city,
      source: "lead finder (OpenStreetMap)", notes: [c.category, c.address, c.hours && `hours: ${c.hours}`].filter(Boolean).join(" · "), lat: c.lat, lng: c.lng };
    const { fit, brief } = scoreAndBrief(lead, intel, zones);
    return {
      lead, enrich: !!c.website,
      intel: { lead_id: id, dedupe_key: dedupeKey(c.website, c.name, c.city), website: c.website, emails: JSON.stringify(intel.emails), phones: JSON.stringify(intel.phones), people: "[]",
        company_info: JSON.stringify({ category: c.category, address: c.address, hours: c.hours, osm_id: c.osmId }), origin: "osm", origin_url: osmUrl, competitor: null,
        fit_score: fit.score, fit_reasons: JSON.stringify(fit.reasons), brief: JSON.stringify(brief), status: c.website ? "discovered" : "no_website" },
    };
  });
  return insertCandidates(env, rows);
}

async function competitorClients(env: Env, net: Net, zones: Zone[]) {
  const comps = await q(env, "SELECT name, sources FROM competitors WHERE services_evidenced <> '[]' AND confidence <> 'low'");
  const pages = comps.flatMap((c) => (JSON.parse(c.sources) as string[]).filter((u) => /(testimonial|review|gallery|portfolio|project|case|commercial|client)/i.test(u)).map((u) => ({ comp: c.name, url: u }))).slice(0, 6);
  const robotsCache = new Map<string, string>();
  const rows: any[] = [];
  for (const { comp, url } of pages) {
    const origin = new URL(url).origin;
    if (!robotsCache.has(origin)) robotsCache.set(origin, await net.get(`${origin}/robots.txt`).then((r) => (r.ok ? r.text() : "")).catch(() => ""));
    if (!robotsAllows(robotsCache.get(origin)!, new URL(url).pathname)) continue;
    const page = await pageHtml(net, url).catch(() => null);
    if (!page) continue;
    for (const { name, context } of extractOrgNames(htmlToText(page.html))) {
      const segment = SEGMENT_FROM_NAME.find(([re]) => re.test(name))?.[1] ?? "storefront";
      const id = crypto.randomUUID();
      const intel = { emails: [], phones: [], people: [], website: null, competitor: comp, category: null };
      const lead = { id, name, company: name, email: null, phone: null, segment, city: "Austin", source: `lead finder (${comp} public page)`, notes: `Seen on ${comp}'s site: “${context}” — verify before outreach`, lat: null, lng: null };
      const { fit, brief } = scoreAndBrief(lead, intel, zones);
      rows.push({ lead, enrich: false, intel: { lead_id: id, dedupe_key: dedupeKey(null, name, "competitor"), website: null, emails: "[]", phones: "[]", people: "[]",
        company_info: JSON.stringify({ seen_on: page.url, context }), origin: "competitor-site", origin_url: page.url, competitor: comp,
        fit_score: fit.score, fit_reasons: JSON.stringify(fit.reasons), brief: JSON.stringify(brief), status: "needs_research" } });
    }
  }
  return insertCandidates(env, rows);
}

async function enrich(env: Env, net: Net, leadId: string, zones: Zone[]) {
  const row = await env.DB.prepare(`SELECT l.id,l.company,l.segment,l.city,l.lat,l.lng,l.email,l.phone,i.website,i.emails,i.phones,i.competitor,i.company_info
    FROM leads l JOIN lead_intel i ON i.lead_id=l.id WHERE l.id=?1`).bind(leadId).first<any>();
  if (!row?.website) return "skipped";
  const origin = new URL(row.website).origin;
  const robots = await net.get(`${origin}/robots.txt`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  if (!robotsAllows(robots, new URL(row.website).pathname || "/")) { await run(env, "UPDATE lead_intel SET status='blocked_by_robots', enriched_at=?2 WHERE lead_id=?1", leadId, new Date().toISOString()); return "robots"; }
  let home = await pageHtml(net, row.website);
  if (!home && /^HTTP 52[56]/.test(lastPageError) && row.website.startsWith("https://")) home = await pageHtml(net, row.website.replace(/^https:/, "http:")); // broken TLS cert
  if (!home) throw new Unreachable(`homepage unavailable: ${lastPageError}`);
  const facts = [extractFacts(home.html, home.url)];
  for (const link of facts[0].links.filter((l) => robotsAllows(robots, new URL(l).pathname)).slice(0, 2)) {
    const p = await pageHtml(net, link).catch(() => null);
    if (p) facts.push(extractFacts(p.html, p.url));
  }
  const suppressed = new Set((await q(env, "SELECT contact FROM suppressions")).map((s) => s.contact));
  const uniq = <T extends { value?: string; name?: string }>(xs: T[]) => xs.filter((x, i) => xs.findIndex((y) => (y.value ?? y.name) === (x.value ?? x.name)) === i);
  // Website-derived contacts are rebuilt on every read (idempotent); only OpenStreetMap-sourced ones carry over.
  const fromOsm = (xs: Found[]) => xs.filter((x) => x.source.includes("openstreetmap.org"));
  const emails = uniq([...fromOsm(JSON.parse(row.emails)), ...facts.flatMap((f) => f.emails)]).filter((e) => !suppressed.has(e.value)).slice(0, 5);
  const phones = uniq([...fromOsm(JSON.parse(row.phones)), ...facts.flatMap((f) => f.phones)]).filter((p) => !suppressed.has(p.value)).slice(0, 4);
  const people = uniq(facts.flatMap((f) => f.people)).slice(0, 6);
  const info = { ...JSON.parse(row.company_info), description: facts.find((f) => f.description)?.description ?? null, socials: [...new Set(facts.flatMap((f) => f.socials))].slice(0, 4), pages_read: facts.length };
  const { fit, brief } = scoreAndBrief(row, { emails, phones, people, website: row.website, competitor: row.competitor, category: info.category }, zones);
  await run(env, "UPDATE leads SET name=COALESCE(?2,name), email=COALESCE(email,?3), phone=COALESCE(phone,?4), updated_at=?5 WHERE id=?1",
    leadId, people[0]?.name ?? null, emails[0]?.value ?? null, phones[0]?.value ?? null, new Date().toISOString());
  await run(env, "UPDATE lead_intel SET emails=?2, phones=?3, people=?4, company_info=?5, fit_score=?6, fit_reasons=?7, brief=?8, status='enriched', enriched_at=?9, error=NULL WHERE lead_id=?1",
    leadId, JSON.stringify(emails), JSON.stringify(phones), JSON.stringify(people), JSON.stringify(info), fit.score, JSON.stringify(fit.reasons), JSON.stringify(brief), new Date().toISOString());
  return "enriched";
}

export async function runQueue(env: Env) {
  const net = budgeted(), done: string[] = [];
  const zones = await zonesOf(env);
  // Weekly refresh: queue discovery for every segment + competitor pages when nothing is pending.
  const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM finder_jobs WHERE kind IN ('discover','competitor') AND created_at > ?1").bind(new Date(Date.now() - 7 * 864e5).toISOString()).first<{ n: number }>();
  if (!recent?.n) await enqueueDiscovery(env);
  const jobs = await q(env, `SELECT id, kind, payload, attempts FROM finder_jobs WHERE status='queued' ORDER BY CASE kind WHEN 'discover' THEN 0 WHEN 'competitor' THEN 1 ELSE 2 END, id LIMIT ?1`, ENRICH_PER_RUN + 1);
  let discovered = false;
  for (const job of jobs) {
    if (net.left < 5) break;
    if (job.kind !== "enrich" && discovered) continue; // one discovery-type job per run
    const payload = JSON.parse(job.payload);
    try {
      const result = job.kind === "discover" ? await discover(env, net, payload.segment, zones)
        : job.kind === "competitor" ? await competitorClients(env, net, zones) : await enrich(env, net, payload.lead_id, zones);
      if (job.kind !== "enrich") discovered = true;
      await run(env, "UPDATE finder_jobs SET status='done', attempts=attempts+1, error=NULL, updated_at=?2 WHERE id=?1", job.id, new Date().toISOString());
      done.push(`${job.kind}${payload.segment ? `:${payload.segment}` : ""} → ${result}`);
    } catch (e) {
      const msg = String((e as Error).message ?? e).slice(0, 300);
      if (e instanceof Unreachable) {
        await run(env, "UPDATE finder_jobs SET status='done', attempts=attempts+1, error=?2, updated_at=?3 WHERE id=?1", job.id, msg, new Date().toISOString());
        await run(env, "UPDATE lead_intel SET status='unreachable', error=?2, enriched_at=?3 WHERE lead_id=?1", payload.lead_id, msg, new Date().toISOString());
        done.push(`enrich ⊘ ${msg}`);
        continue;
      }
      await run(env, "UPDATE finder_jobs SET status=CASE WHEN attempts+1 >= 3 THEN 'failed' ELSE 'queued' END, attempts=attempts+1, error=?2, updated_at=?3 WHERE id=?1", job.id, msg, new Date().toISOString());
      if (job.kind === "enrich") await run(env, "UPDATE lead_intel SET status=CASE WHEN ?2 >= 2 THEN 'error' ELSE status END, error=?3 WHERE lead_id=?1", payload.lead_id, job.attempts, msg);
      done.push(`${job.kind} ✗ ${msg}`);
    }
  }
  return { ran: done, fetchesLeft: net.left };
}

export async function enqueueDiscovery(env: Env, segments = Object.keys(SEGMENT_QUERIES), competitor = true) {
  const jobs = segments.filter((s) => s in SEGMENT_QUERIES).map((segment) => ({ kind: "discover", payload: JSON.stringify({ segment }) }));
  if (competitor) jobs.push({ kind: "competitor", payload: "{}" });
  await run(env, "INSERT INTO finder_jobs (kind, payload) SELECT json_extract(value,'$.kind'), json_extract(value,'$.payload') FROM json_each(?1)", JSON.stringify(jobs));
  return jobs.length;
}

const safeEqual = (a: string, b: string) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

export default {
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(runQueue(env));
  },
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);
    const key = req.headers.get("x-finder-key") ?? "";
    if (!env.FINDER_KEY || env.FINDER_KEY.length < 24 || !safeEqual(key, env.FINDER_KEY)) return new Response("Shoal Creek Clean lead finder. See https://wash.ackerworks.com/bot\n", { status: url.pathname === "/" ? 200 : 404 });
    if (req.method === "POST" && url.pathname === "/discover") {
      const b = ((await req.json().catch(() => ({}))) ?? {}) as { segments?: string[]; competitor?: boolean };
      return Response.json({ queued: await enqueueDiscovery(env, b.segments, b.competitor ?? true) });
    }
    if (req.method === "POST" && url.pathname === "/run") return Response.json(await runQueue(env));
    if (url.pathname === "/status")
      return Response.json({
        jobs: await q(env, "SELECT kind, status, COUNT(*) AS n FROM finder_jobs GROUP BY kind, status"),
        leads: await q(env, "SELECT origin, status, COUNT(*) AS n, ROUND(AVG(fit_score)) AS avg_fit FROM lead_intel GROUP BY origin, status"),
      });
    return new Response("Not found", { status: 404 });
  },
};
