import { one, q } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { jobForField } from "@/lib/fieldctx";
import { sendMail } from "@/lib/mail";

const NEXT: Record<string, string> = { scheduled: "en_route", en_route: "in_progress", in_progress: "completed" };
const GAP: Record<string, number> = { monthly: 30, quarterly: 91, biannual: 182 };

export const POST = route(async (req, { params }) => {
  const { job } = await jobForField((await params).id);
  const { status } = await req.json();
  if (NEXT[job.status] !== status) throw bad(`Can't go from ${job.status} to ${status}`);
  if (status === "completed") {
    const [{ before, after }] = await q("SELECT COUNT(*) FILTER (WHERE kind='before')::int AS before, COUNT(*) FILTER (WHERE kind='after')::int AS after FROM job_photos WHERE job_id=$1", [job.id]);
    if (!before || !after) throw bad("Upload at least one before and one after photo to complete");
  }
  const j = await one(
    `UPDATE jobs SET status=$2::job_status,
       clock_in = CASE WHEN $2='in_progress' THEN now() ELSE clock_in END,
       clock_out = CASE WHEN $2='completed' THEN now() ELSE clock_out END,
       actual_minutes = CASE WHEN $2='completed' THEN GREATEST(1, EXTRACT(EPOCH FROM now() - COALESCE(clock_in, now()))::int / 60) ELSE actual_minutes END
     WHERE id=$1 RETURNING *`, [job.id, status]);
  if (status === "en_route") await sendMail(job.client_email, "Your crew is on the way", `Hi ${job.contact_name}, your Shoal Creek Clean crew is en route for "${job.title}". Track live in your portal.`, "status");
  if (status === "completed") {
    await q("INSERT INTO invoices (client_id,job_id,description,amount_cents) SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE job_id=$2)", [job.client_id, job.id, job.title, job.price_cents]);
    await sendMail(job.client_email, "Job complete — before/after photos inside", `Hi ${job.contact_name},\n\n"${job.title}" is complete. View photo proof and your invoice: ${process.env.APP_URL ?? ""}/client`, "status");
    if (GAP[job.frequency]) // recurring maintenance contract → queue next visit for dispatch
      await q(`INSERT INTO jobs (client_id,quote_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,crew_size,equipment,frequency,price_cents)
               SELECT client_id,quote_id,title,service,address,lat,lng,scheduled_start + make_interval(days => $2::int),quoted_minutes,crew_size,equipment,frequency,price_cents FROM jobs WHERE id=$1`, [job.id, GAP[job.frequency]]);
  }
  return { status: j!.status };
});
