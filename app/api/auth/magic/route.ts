import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { homeFor } from "@/lib/session";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const u = await one(
    `UPDATE magic_links m SET used_at=now() FROM users u
     WHERE m.token_hash=$1 AND m.used_at IS NULL AND m.expires_at > now() AND u.id=m.user_id
     RETURNING u.id,u.email,u.name,u.role`,
    [createHash("sha256").update(token).digest("hex")],
  );
  if (!u) return NextResponse.redirect(new URL("/login?error=link", req.url));
  await setSession({ uid: u.id, role: u.role, name: u.name, email: u.email });
  return NextResponse.redirect(new URL(homeFor(u.role), req.url));
}
