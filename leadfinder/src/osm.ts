// OpenStreetMap (Overpass API) discovery: named Central Texas businesses in our target segments that
// publish a website or phone. Data © OpenStreetMap contributors, ODbL. Pure query building + mapping.
import { CITY_COORDS } from "../../lib/content.ts";
import { haversineKm } from "../../lib/geo.ts";

// Phase-1 service area (Austin core → Round Rock/Pflugerville → Cedar Park/Leander): south, west, north, east
export const BBOX = [30.2, -97.9, 30.6, -97.57] as const;

export const SEGMENT_QUERIES: Record<string, string[]> = {
  property_management: ['["office"~"^(property_management|estate_agent)$"]'],
  multifamily: ['["building"="apartments"]["name"]', '["landuse"="residential"]["name"~"Apartments|Townhomes|Villas|Residences",i]'],
  retail_center: ['["shop"~"^(mall|department_store|supermarket)$"]', '["landuse"="retail"]["name"]'],
  restaurant: ['["amenity"~"^(restaurant|fast_food|cafe)$"]'],
  office_park: ['["office"~"^(company|coworking|it|financial|insurance|lawyer|accountant)$"]'],
  storefront: ['["amenity"~"^(fuel|car_wash|bank|dentist|clinic|veterinary)$"]', '["shop"~"^(car|car_repair|hardware|furniture|beauty|hairdresser|clothes)$"]'],
};

/** One Overpass QL query per segment; only named places with a website or phone. */
export function overpassQuery(segment: string, limit = 150) {
  const [s, w, n, e] = BBOX;
  const filters = SEGMENT_QUERIES[segment];
  if (!filters) throw new Error(`unknown segment ${segment}`);
  const body = filters.map((f) => `nwr${f}["name"][~"^(website|contact:website|phone|contact:phone)$"~"."](${s},${w},${n},${e});`).join("\n  ");
  return `[out:json][timeout:60];\n(\n  ${body}\n);\nout center tags ${limit};`;
}

export type OsmElement = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };
export type Candidate = {
  name: string; segment: string; category: string; website: string | null; phone: string | null; email: string | null;
  address: string | null; city: string; lat: number | null; lng: number | null; osmId: string; hours: string | null;
};

const nearestCity = (lat: number, lng: number) =>
  Object.entries(CITY_COORDS).sort(([, a], [, b]) => haversineKm({ lat, lng }, { lat: a[0], lng: a[1] }) - haversineKm({ lat, lng }, { lat: b[0], lng: b[1] }))[0][0];

export function mapElement(el: OsmElement, segment: string): Candidate | null {
  const t = el.tags ?? {};
  if (!t.name) return null;
  const lat = el.lat ?? el.center?.lat ?? null, lng = el.lon ?? el.center?.lon ?? null;
  const website = t.website ?? t["contact:website"] ?? null;
  const category = t.amenity ?? t.shop ?? t.office ?? t.building ?? t.landuse ?? "business";
  const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
  return {
    name: t.name,
    segment,
    category: category === "fast_food" ? "fast food (drive-thru likely)" : category.replace(/_/g, " "),
    website: website && /^https?:\/\//.test(website) ? website : website ? `https://${website}` : null,
    phone: t.phone ?? t["contact:phone"] ?? null,
    email: t.email ?? t["contact:email"] ?? null,
    address: street ? `${street}${t["addr:city"] ? `, ${t["addr:city"]}` : ""}` : null,
    city: t["addr:city"] ?? (lat != null && lng != null ? nearestCity(lat, lng) : "Austin"),
    lat, lng,
    osmId: `${el.type}/${el.id}`,
    hours: t.opening_hours ?? null,
  };
}
