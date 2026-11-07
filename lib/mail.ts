import "server-only";
import { q } from "./db";

/**
 * Every email is recorded in email_outbox. Real delivery happens only when RESEND_API_KEY is set
 * (HTTP API — Workers can't speak SMTP); otherwise the message is "simulated" and visible in the Outbox.
 */
export async function sendMail(to: string, subject: string, body: string, kind = "transactional", campaignId: string | null = null) {
  let status = "simulated";
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text: body }),
      });
      status = res.ok ? "sent" : "failed";
    } catch (e) {
      console.error("email", e);
      status = "failed";
    }
  }
  await q("INSERT INTO email_outbox (to_email, subject, body, kind, campaign_id, status) VALUES ($1,$2,$3,$4,$5,$6)", [to, subject, body, kind, campaignId, status]);
  return status;
}
export { merge } from "./merge";
