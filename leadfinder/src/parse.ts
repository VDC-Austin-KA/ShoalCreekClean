// Pure HTML/robots parsing for the lead finder. Extracts only what a business publishes about itself:
// mailto/visible emails (incl. Cloudflare-obfuscated ones), tel/visible phones, people named with a
// job title, and links to its own contact/about/team pages. Unit-tested in tests/leadfinder.test.ts.

export type Found = { value: string; source: string };
export type Person = { name: string; title: string; source: string };
export type PageFacts = { emails: Found[]; phones: Found[]; people: Person[]; links: string[]; socials: string[]; description: string | null };

const ENT: Record<string, string> = { rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', mdash: "—", ndash: "–", hellip: "…", eacute: "é" };
const decode = (s: string) => s.replace(/&(rsquo|lsquo|ldquo|rdquo|mdash|ndash|hellip|eacute);/g, (_, k) => ENT[k]).replace(/&amp;/g, "&").replace(/&#64;|&#x40;/gi, "@").replace(/&#46;|&#x2e;/gi, ".").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

export function htmlToText(html: string) {
  return decode(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
}

/** Cloudflare "email protection" encodes addresses as hex XOR'd with the first byte. */
export function decodeCfEmail(hex: string) {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}

const JUNK_EMAIL = /(\.(png|jpe?g|gif|webp|svg)$)|example\.|sentry|wixpress|domain\.com|email\.com|yourname|@2x|godaddy|placeholder|test@|noreply|no-reply/i;
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (d.length !== 10 || /^(\d)\1{9}$/.test(d) || d.startsWith("0") || d.startsWith("1") || d.slice(3, 6) === "555" && d.slice(6, 8) === "01") return null;
  return `+1${d}`;
}

const TITLES = "General Manager|Property Manager|Community Manager|Facilities Manager|Facility Manager|Operations Manager|Director of Operations|Regional Manager|Assistant Manager|Leasing Manager|Building Manager|Store Manager|Owner|Co-Owner|Founder|Co-Founder|President|Managing Partner|Office Manager";
const NAME = "([A-Z][a-z]+(?:[-'][A-Z][a-z]+)?(?: [A-Z]\\.)?(?: [A-Z][a-z]+(?:[-'][A-Z][a-z]+)?){1,2})";
const NOT_NAMES = /^(Contact|About|Our|The|Meet|Call|Email|Home|Menu|Hours|Location|Austin|Texas|Round Rock|Cedar Park|Read More|Learn More|Customer|Service|Team|Leasing|Office)\b/;

export function extractPeople(text: string, source: string): Person[] {
  const out: Person[] = [];
  const patterns = [
    new RegExp(`${NAME}\\s*(?:,|–|—|-|\\||\\n)\\s*(${TITLES})\\b`, "g"),
    new RegExp(`\\b(${TITLES})\\s*(?::|–|—|-|\\||\\n)\\s*${NAME}`, "g"),
  ];
  for (const [i, re] of patterns.entries())
    for (const m of text.matchAll(re)) {
      const [name, title] = i === 0 ? [m[1], m[2]] : [m[2], m[1]];
      if (NOT_NAMES.test(name) || out.some((p) => p.name === name)) continue;
      out.push({ name, title, source });
    }
  return out.slice(0, 6);
}

export function extractFacts(html: string, pageUrl: string): PageFacts {
  const base = new URL(pageUrl);
  const host = base.hostname.replace(/^www\./, "");
  const emails = new Map<string, Found>(), phones = new Map<string, Found>();
  const addEmail = (e: string) => {
    const v = decode(e).trim().toLowerCase().replace(/^mailto:/, "").split("?")[0];
    if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v) && !JUNK_EMAIL.test(v) && !emails.has(v)) emails.set(v, { value: v, source: pageUrl });
  };
  for (const m of html.matchAll(/href=["']mailto:([^"'?]+)/gi)) addEmail(m[1]);
  for (const m of html.matchAll(/data-cfemail=["']([0-9a-f]+)["']/gi)) addEmail(decodeCfEmail(m[1]));
  const text = htmlToText(html);
  for (const m of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) addEmail(m[0]);
  const addPhone = (p: string) => { const v = normalizePhone(p); if (v && !phones.has(v)) phones.set(v, { value: v, source: pageUrl }); };
  for (const m of html.matchAll(/href=["']tel:([^"']+)/gi)) addPhone(m[1]);
  for (const m of text.matchAll(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g)) addPhone(m[0]);

  const links = new Set<string>(), socials = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(decode(m[1]), base); } catch { continue; }
    if (/(facebook|instagram|linkedin|twitter|x)\.com$/.test(u.hostname.replace(/^www\./, ""))) { socials.add(u.origin + u.pathname); continue; }
    const label = htmlToText(m[2]).toLowerCase();
    if (u.hostname.replace(/^www\./, "") === host && /^https?:$/.test(u.protocol) && /(contact|about|team|staff|leadership|management|our-story|who-we-are)/.test(u.pathname.toLowerCase() + " " + label))
      links.add(u.origin + u.pathname);
  }
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,300})["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']{10,300})["'][^>]+name=["']description["']/i)?.[1] ?? null;
  // Prefer addresses on the business's own domain.
  const sorted = [...emails.values()].sort((a, b) => Number(b.value.endsWith("@" + host)) - Number(a.value.endsWith("@" + host)));
  return { emails: sorted.slice(0, 5), phones: [...phones.values()].slice(0, 4), people: extractPeople(text, pageUrl), links: [...links].slice(0, 4), socials: [...socials].slice(0, 4), description: desc ? decode(desc) : null };
}

/** Minimal robots.txt check for our user agent (falls back to the * group). Longest matching rule wins. */
export function robotsAllows(robots: string, path: string, agent = "shoalcreekcleanleadfinder"): boolean {
  const groups: { agents: string[]; rules: { allow: boolean; prefix: string }[] }[] = [];
  let cur: (typeof groups)[number] | null = null, lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
    if (!m) continue;
    const [k, v] = [m[1].toLowerCase(), m[2].trim()];
    if (k === "user-agent") {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(v.toLowerCase()); lastWasAgent = true;
    } else if (cur) { lastWasAgent = false; if (v || k === "allow") cur.rules.push({ allow: k === "allow", prefix: v }); }
  }
  const g = groups.find((g) => g.agents.some((a) => a !== "*" && agent.includes(a))) ?? groups.find((g) => g.agents.includes("*"));
  if (!g) return true;
  const hit = g.rules.filter((r) => r.prefix && path.startsWith(r.prefix.replace(/\*$/, ""))).sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return hit ? hit.allow : true;
}

/** Candidate client names from a competitor's public testimonial / gallery text. Needs human review. */
export function extractOrgNames(text: string): { name: string; context: string }[] {
  const suffix = "Apartments|Townhomes|Condominiums|Condos|HOA|Homeowners Association|Plaza|Shopping Center|Center|Commons|Village|Crossing|Market|Marketplace|Church|School|Academy|Hotel|Inn|Suites|Dental|Clinic|Medical|Office Park|Business Park|Properties|Property Management|Management|Realty|Restaurant|Cafe|Café|Grill|Kitchen|Bar|Brewery|Taqueria|Bakery|Coffee|Fitness|Storage|Auto|Motors";
  const re = new RegExp(`\\b((?:[A-Z][A-Za-z'&.]+\\s){0,4}(?:${suffix}))\\b`, "g");
  const out: { name: string; context: string }[] = [];
  for (const m of text.matchAll(re)) {
    const name = m[1].trim();
    if (name.split(" ").length < 2 || /^(The|Our|A|An|Your|This|Every|Shopping Center|Business Park|Property Management)$/i.test(name) || out.some((o) => o.name === name)) continue;
    const at = m.index ?? 0;
    out.push({ name, context: text.slice(Math.max(0, at - 80), at + name.length + 80).replace(/\s+/g, " ").trim() });
  }
  return out.slice(0, 25);
}

export const dedupeKey = (website: string | null | undefined, name: string, city: string | null | undefined) => {
  if (website) { try { return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { /* fall through */ } }
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}|${(city ?? "").toLowerCase()}`;
};
