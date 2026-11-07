import "server-only";
import { one } from "./db";
import { requireApi, requirePage, HttpError } from "./auth";

export async function clientForPage() {
  const s = await requirePage(["client"]);
  const c = await one("SELECT * FROM clients WHERE user_id=$1", [s.uid]);
  return { s, c };
}
export async function clientForApi() {
  const s = await requireApi(["client"]);
  const c = await one("SELECT * FROM clients WHERE user_id=$1", [s.uid]);
  if (!c) throw new HttpError(404, "No client profile");
  return c;
}
