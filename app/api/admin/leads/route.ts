import { one } from "@/lib/db";
import { route, bad, str, isEmail } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { CITY_COORDS } from "@/lib/content";

export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  const email = str(b.email, 200).toLowerCase();
  if (!str(b.name) || !isEmail(email)) throw bad("Name and valid email required");
  const [lat, lng] = CITY_COORDS[str(b.city)] ?? CITY_COORDS.Austin;
  return one(`INSERT INTO leads (name,company,email,phone,segment,city,value_cents,source,notes,lat,lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [str(b.name, 120), str(b.company, 120) || null, email, str(b.phone, 40) || null, str(b.segment, 40) || "storefront", str(b.city, 60) || "Austin",
     Math.round((Number(b.value) || 0) * 100), str(b.source, 40) || "manual", str(b.notes, 2000) || null, lat + (Math.random() - 0.5) * 0.04, lng + (Math.random() - 0.5) * 0.04]);
});
