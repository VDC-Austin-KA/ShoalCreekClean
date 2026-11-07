import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { jobForField } from "@/lib/fieldctx";
import { sendMail } from "@/lib/mail";
import { addDays, ctClock, ctDate, ctToUtc } from "@/lib/tz";

const NEXT: Record<string, string> = { scheduled: "en_route", en_route: "in_progress", in_progress: "completed" };
const GAP: Record<string, number> = { monthly: 30, quarterly: 91, biannual: 182 };

export const POST = route(async (req, { params }) => {
  const { job } = await jobForField((await params).id);
  const { status } = await req.json();
  if (NEXT[job.status] !== status) throw bad(`Can't go from ${job.status} to ${status}`);
  if (status === "completed") {
    const [{ before, after }] = await q("SELECT SUM(kind='before') AS before, SUM(kind='after') AS after FROM job_photos WHERE job_id=$1", [job.id]);
    if (!before || !after) throw bad("Upload at least one before and one after photo to complete");
  }
  const now = new Date();
  const actual = status === "completed" ? Math.max(1, Math.round((now.getTime() - new Date(job.clock_in ?? now).getTime()) / 60000)) : null;
  const j = await one(
    `UPDATE jobs SET status=$2,
       clock_in = CASE WHEN $2='in_progress' THEN $3 ELSE clock_in END,
       clock_out = CASE WHEN $2='completed' THEN $3 ELSE clock_out END,
       actual_minutes = COALESCE($4, actual_minutes)
     WHERE id=$1 RETURNING status`, [job.id, status, now, actual]);
  if (status === "en_route") await sendMail(job.client_email, "Your crew is on the way", `Hi ${job.contact_name}, your Shoal Creek Clean crew is en route for "${job.title}". Track live in your portal.`, "status");
  if (status === "completed") {
    await q("INSERT INTO invoices (client_id,job_id,description,amount_cents) SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE job_id=$2)", [job.client_id, job.id, job.title, job.price_cents]);
    await sendMail(job.client_email, "Job complete — before/after photos inside", `Hi ${job.contact_name},\n\n"${job.title}" is complete. View photo proof and your invoice: ${process.env.APP_URL ?? ""}/client`, "status");
    if (GAP[job.frequency] && job.scheduled_start) {
      // Recurring maintenance contract → queue the next visit (same Central-time clock) for dispatch.
      const next = ctToUtc(addDays(ctDate(job.scheduled_start), GAP[job.frequency]), ctClock(job.scheduled_start));
      await q(`INSERT INTO jobs (client_id,quote_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,crew_size,equipment,frequency,price_cents)
               SELECT client_id,quote_id,title,service,address,lat,lng,$2,quoted_minutes,crew_size,equipment,frequency,price_cents FROM jobs WHERE id=$1`, [job.id, next]);
    }
  }
  return { status: j!.status };
});
