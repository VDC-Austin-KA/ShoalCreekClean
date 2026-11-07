// Edge-safe session helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export type Role = "owner" | "manager" | "crew" | "client";
export type Session = { uid: string; role: Role; name: string; email: string };
export const COOKIE = "scc_session";
const key = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required in production");
  return new TextEncoder().encode(secret || "dev-only-insecure-secret-change-me-please");
};

export async function signSession(s: Session) {
  return new SignJWT(s).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("14d").sign(key());
}
export async function verifySession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload as unknown as Session;
  } catch {
    return null;
  }
}
export const STAFF: Role[] = ["owner", "manager"];
export const homeFor = (r: Role) => (r === "client" ? "/client" : r === "crew" ? "/field" : "/admin");
