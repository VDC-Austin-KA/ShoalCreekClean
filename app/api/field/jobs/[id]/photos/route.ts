import { one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { jobForField } from "@/lib/fieldctx";

export const POST = route(async (req, { params }) => {
  const { s, job } = await jobForField((await params).id);
  const { kind, dataUrl } = await req.json();
  if (!["before", "after"].includes(kind)) throw bad("kind must be before or after");
  if (typeof dataUrl !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 3_000_000) throw bad("Image must be a JPEG/PNG/WebP under ~2MB");
  return one("INSERT INTO job_photos (job_id,kind,data_url,taken_by) VALUES ($1,$2,$3,$4) RETURNING id", [job.id, kind, dataUrl, s.uid]);
});
