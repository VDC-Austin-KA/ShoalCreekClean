import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { homeFor } from "@/lib/session";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  // Single atomic statement consumes the link, so a token can only ever be used once.
  const link = await one<{ user_id: string }>(
    "UPDATE magic_links SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now() RETURNING user_id",
    [createHash("sha256").update(token).digest("hex")],
  );
  const u = link && (await one("SELECT id,email,name,role FROM users WHERE id=$1", [link.user_id]));
  if (!u) return NextResponse.redirect(new URL("/login?error=link", req.url));
  await setSession({ uid: u.id, role: u.role, name: u.name, email: u.email });
  return NextResponse.redirect(new URL(homeFor(u.role), req.url));
}
