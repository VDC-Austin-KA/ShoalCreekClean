import { one } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { audience } from "@/lib/audience";

export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  if (!str(b.name) || !str(b.subject) || !str(b.body)) throw bad("Name, subject and body are required");
  return one("INSERT INTO campaigns (name,subject,body,audience) VALUES ($1,$2,$3,$4) RETURNING id", [str(b.name, 120), str(b.subject, 200), str(b.body, 20000), str(b.audience, 40) || "all"]);
});
/** Audience size preview: GET ?audience=commercial */
export const GET = route(async (req) => {
  await requireApi(STAFF);
  return { count: (await audience(new URL(req.url).searchParams.get("audience") ?? "all")).length };
});
