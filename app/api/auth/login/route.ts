import bcrypt from "bcryptjs";
import { one } from "@/lib/db";
import { route, str } from "@/lib/api";
import { HttpError, setSession } from "@/lib/auth";
import { homeFor } from "@/lib/session";

export const POST = route(async (req) => {
  const b = await req.json();
  const email = str(b.email, 200).toLowerCase();
  const u = await one("SELECT id,email,name,role,password_hash FROM users WHERE email=$1", [email]);
  if (!u?.password_hash || !(await bcrypt.compare(String(b.password ?? ""), u.password_hash))) throw new HttpError(401, "Invalid email or password");
  await setSession({ uid: u.id, role: u.role, name: u.name, email: u.email });
  return { home: homeFor(u.role) };
});
