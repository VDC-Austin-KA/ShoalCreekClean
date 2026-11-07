import { one } from "@/lib/db";
import { route, bad } from "@/lib/api";
import { clientForApi } from "@/lib/clientctx";
import { FREQ_LABEL } from "@/lib/format";

export const PATCH = route(async (req, { params }) => {
  const c = await clientForApi();
  const { frequency } = await req.json();
  if (!(frequency in FREQ_LABEL)) throw bad("Invalid frequency");
  const j = await one("UPDATE jobs SET frequency=$3 WHERE id=$1 AND client_id=$2 RETURNING id", [(await params).id, c.id, frequency]);
  if (!j) throw bad("Job not found");
  return { ok: true };
});
