// Lead fit score (0–100) with human-readable reasons. Pure; shared by the app and the lead finder.
import { inPolygon } from "./geo.ts";

export type FitInput = {
  segment: string;
  lat?: number | null;
  lng?: number | null;
  emails?: unknown[];
  phones?: unknown[];
  people?: { title?: string }[];
  website?: string | null;
  competitor?: string | null;
};
export type Zone = { name: string; phase: number; polygon: number[][] };

const SEGMENT_POINTS: Record<string, number> = {
  property_management: 30, retail_center: 28, hoa: 26, multifamily: 24, office_park: 22, restaurant: 20, storefront: 14, residential: 4,
};
const DECISION_TITLES = /(property|facilit|general|operations|community|asset|regional|building|owner|president|manager|director)/i;

export function fitScore(l: FitInput, zones: Zone[] = []): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = SEGMENT_POINTS[l.segment] ?? 10;
  reasons.push(`segment ${l.segment.replace("_", " ")} (+${score})`);
  if (l.lat != null && l.lng != null) {
    const z = zones.find((z) => inPolygon({ lat: l.lat!, lng: l.lng! }, z.polygon));
    if (z) { const p = z.phase === 1 ? 20 : 8; score += p; reasons.push(`in ${z.name} (+${p})`); }
    else reasons.push("outside service zones (+0)");
  }
  if (l.people?.some((p) => DECISION_TITLES.test(p.title ?? ""))) { score += 15; reasons.push("named decision-maker on website (+15)"); }
  if (l.emails?.length) { score += 12; reasons.push("published email (+12)"); }
  if (l.phones?.length) { score += 8; reasons.push("published phone (+8)"); }
  if (l.website) { score += 5; reasons.push("has website (+5)"); }
  if (l.competitor) { score += 10; reasons.push(`already buys exterior cleaning (${l.competitor} client) (+10)`); }
  return { score: Math.min(100, score), reasons };
}
