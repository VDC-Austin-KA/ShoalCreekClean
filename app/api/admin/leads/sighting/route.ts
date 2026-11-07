import { one, q } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { CITY_COORDS } from "@/lib/content";
import { fitScore } from "@/lib/fit";
import { generateBrief } from "@/lib/brief";
import { SEGMENTS } from "@/lib/format";

/** Field sighting: a competitor's truck or yard sign seen at a property → a researched lead with a comparison-focused brief. */
export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  const company = str(b.company, 120), competitor = str(b.competitor, 80) || "another vendor", city = str(b.city, 60) || "Austin";
  const segment = (SEGMENTS as readonly string[]).includes(b.segment) ? b.segment : "storefront";
  if (!company) throw bad("Business or property name is required");
  const [lat, lng] = CITY_COORDS[city] ?? CITY_COORDS.Austin;
  const zones = (await q("SELECT name, phase, polygon FROM service_zones")) as { name: string; phase: number; polygon: number[][] }[];
  const fit = fitScore({ segment, lat, lng, competitor }, zones);
  const brief = generateBrief({ company, segment, city, competitor });
  const notes = [`${competitor} seen on site`, str(b.address, 160), str(b.notes, 500)].filter(Boolean).join(" · ");
  const lead = await one(`INSERT INTO leads (name, company, segment, city, source, notes, lat, lng) VALUES ($1,$1,$2,$3,'field sighting',$4,$5,$6) RETURNING id`, [company, segment, city, notes, lat, lng]);
  await q(`INSERT INTO lead_intel (lead_id, dedupe_key, company_info, origin, competitor, fit_score, fit_reasons, brief, status)
           VALUES ($1, $2, $3, 'field-sighting', $4, $5, $6, $7, 'needs_research')`,
    [lead!.id, `sighting:${lead!.id}`, { address: str(b.address, 160) || null, context: `${competitor} seen on site${b.notes ? `: ${str(b.notes, 300)}` : ""}` }, competitor, fit.score, fit.reasons, brief]);
  return { id: lead!.id };
});
