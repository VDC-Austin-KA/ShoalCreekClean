import { one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { clientForApi } from "@/lib/clientctx";
import { sendMail } from "@/lib/mail";

const GAP_DAYS: Record<string, number> = { one_time: 7, monthly: 30, quarterly: 91, biannual: 182 };
/** One-click re-book: clone the job onto the next slot for its frequency (unassigned → dispatch). */
export const POST = route(async (_req, { params }) => {
  const c = await clientForApi();
  const src = await one("SELECT * FROM jobs WHERE id=$1 AND client_id=$2", [(await params).id, c.id]);
  if (!src) throw bad("Job not found");
  const job = await one(
    `INSERT INTO jobs (client_id,quote_id,title,service,address,lat,lng,scheduled_start,quoted_minutes,crew_size,equipment,frequency,price_cents)
     SELECT client_id,quote_id,title,service,address,lat,lng, GREATEST(COALESCE(scheduled_start, now()), now()) + make_interval(days => $2::int),
       quoted_minutes,crew_size,equipment,frequency,price_cents FROM jobs WHERE id=$1 RETURNING scheduled_start`,
    [src.id, GAP_DAYS[src.frequency] ?? 7]);
  await sendMail("team@shoalcreek.test", `Client re-booked: ${src.title}`, `${c.contact_name} re-booked for ${job!.scheduled_start}`, "internal");
  return { ok: true, scheduled_start: job!.scheduled_start };
});
