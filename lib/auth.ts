import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, signSession, verifySession, type Role, type Session } from "./session";

export async function getSession() {
  return verifySession((await cookies()).get(COOKIE)?.value);
}
export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, await signSession(s), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14,
  });
}
/** For pages: redirect to login when role not allowed. */
export async function requirePage(roles: Role[]) {
  const s = await getSession();
  if (!s || !roles.includes(s.role)) redirect("/login");
  return s;
}
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
/** For API routes: throw 401/403. */
export async function requireApi(roles: Role[]) {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Not signed in");
  if (!roles.includes(s.role)) throw new HttpError(403, "Forbidden");
  return s;
}
