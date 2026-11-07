import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Signed one-click unsubscribe links (CAN-SPAM). Token = HMAC(SESSION_SECRET, email).
const key = () => process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please";
export const unsubToken = (email: string) => createHmac("sha256", key()).update(email.toLowerCase()).digest("hex").slice(0, 32);
export const unsubUrl = (email: string) => `${process.env.APP_URL ?? ""}/u?e=${encodeURIComponent(email.toLowerCase())}&t=${unsubToken(email)}`;
export function validUnsub(email: string, token: string) {
  const want = Buffer.from(unsubToken(email)), got = Buffer.from(token);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Footer required on commercial email: who we are, a physical mailing address, and a working opt-out. */
export function complianceFooter(email: string) {
  const addr = process.env.BUSINESS_ADDRESS || "[mailing address not set — add BUSINESS_ADDRESS before real sends]";
  return `\n\n—\nShoal Creek Clean · locally owned in Austin, TX · ${addr}\nNot interested? Unsubscribe in one click: ${unsubUrl(email)}`;
}
