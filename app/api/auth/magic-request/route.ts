import { randomBytes, createHash } from "node:crypto";
import { one, q } from "@/lib/db";
import { route, str } from "@/lib/api";
import { sendMail } from "@/lib/mail";

export const POST = route(async (req) => {
  const email = str((await req.json()).email, 200).toLowerCase();
  const u = await one("SELECT id,name FROM users WHERE email=$1", [email]);
  if (!u) return { ok: true }; // don't reveal account existence
  const token = randomBytes(24).toString("base64url");
  await q("INSERT INTO magic_links (token_hash,user_id,expires_at) VALUES ($1,$2,$3)", [createHash("sha256").update(token).digest("hex"), u.id, new Date(Date.now() + 20 * 60e3)]);
  const link = `${process.env.APP_URL ?? ""}/api/auth/magic?token=${token}`;
  await sendMail(email, "Your Shoal Creek Clean sign-in link", `Hi ${u.name},\n\nSign in (valid 20 minutes): ${link}`, "auth");
  return { ok: true, link: process.env.ALPHA_MODE === "true" ? link : undefined };
});
