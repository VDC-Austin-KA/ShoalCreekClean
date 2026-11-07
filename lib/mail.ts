import "server-only";
import { q } from "./db";

/** Every email is recorded in email_outbox. Delivered via SMTP only when SMTP_URL is set. */
export async function sendMail(to: string, subject: string, body: string, kind = "transactional", campaignId: string | null = null) {
  let status = "simulated";
  if (process.env.SMTP_URL) {
    try {
      const nodemailer = await import("nodemailer");
      await nodemailer.createTransport(process.env.SMTP_URL).sendMail({ from: process.env.MAIL_FROM, to, subject, text: body });
      status = "sent";
    } catch (e) {
      console.error("smtp", e);
      status = "failed";
    }
  }
  await q("INSERT INTO email_outbox (to_email, subject, body, kind, campaign_id, status) VALUES ($1,$2,$3,$4,$5,$6)", [to, subject, body, kind, campaignId, status]);
  return status;
}
export { merge } from "./merge";
