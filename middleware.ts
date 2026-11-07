import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession, STAFF, type Role } from "@/lib/session";

const GUARDS: [string, Role[]][] = [
  ["/admin", STAFF],
  ["/field", ["crew", ...STAFF]],
  ["/client", ["client"]],
];
export async function middleware(req: NextRequest) {
  const rule = GUARDS.find(([p]) => req.nextUrl.pathname.startsWith(p));
  if (!rule) return NextResponse.next();
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  if (s && rule[1].includes(s.role)) return NextResponse.next();
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
export const config = { matcher: ["/admin/:path*", "/field/:path*", "/client/:path*"] };
