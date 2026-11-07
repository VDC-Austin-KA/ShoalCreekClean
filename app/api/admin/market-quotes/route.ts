import { one } from "@/lib/db";
import { route, bad, str } from "@/lib/api";
import { requireApi } from "@/lib/auth";
import { STAFF } from "@/lib/session";

export const POST = route(async (req) => {
  await requireApi(STAFF);
  const b = await req.json();
  const amount = Number(b.amount), qty = Number(b.quantity) || null;
  if (!str(b.competitor) || !(amount > 0 && amount < 1e6)) throw bad("Competitor and a quoted amount are required");
  return one(`INSERT INTO market_quotes (competitor,service,quantity,unit,amount_cents,city,source,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [str(b.competitor, 120), str(b.service, 40) || "flatwork", qty, qty ? (b.unit === "lf" ? "lf" : "sqft") : null, Math.round(amount * 100), str(b.city, 60) || null,
     ["partner", "prospect", "public"].includes(b.source) ? b.source : "partner", str(b.notes, 1000) || null]);
});
