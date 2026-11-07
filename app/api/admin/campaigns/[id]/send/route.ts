import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";
import { audience } from "@/lib/audience";
import { merge, sendMail } from "@/lib/mail";
import { complianceFooter } from "@/lib/unsub";

export const POST = route(async (_req, { params }) => {
  await requireApi(STAFF);
  const c = await one("SELECT * FROM campaigns WHERE id=$1", [(await params).id]);
  if (!c) throw bad("Campaign not found");
  if (c.status === "sent") throw bad("Already sent");
  // CAN-SPAM: real delivery needs a physical mailing address in every message.
  if (process.env.RESEND_API_KEY && !process.env.BUSINESS_ADDRESS) throw bad("Set BUSINESS_ADDRESS (your mailing address) before sending real campaigns");
  const list = await audience(c.audience); // already excludes the do-not-contact list
  const quote_url = `${process.env.APP_URL ?? ""}/quote`;
  for (const r of list) {
    const v = { first_name: r.name.split(" ")[0], company: r.company ?? "your property", city: r.city || "Austin", quote_url };
    await sendMail(r.email, merge(c.subject, v), merge(c.body, v) + complianceFooter(r.email), "campaign", c.id);
  }
  await q("UPDATE campaigns SET status='sent', sent_at=now(), recipient_count=$2 WHERE id=$1", [c.id, list.length]);
  return { sent: list.length };
});
