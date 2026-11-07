import { q, one } from "@/lib/db";
import { route, bad, str, isEmail } from "@/lib/api";
import { computeQuote, FREQUENCY, HEIGHT, SOIL, SURFACE, type QuoteInput } from "@/lib/pricing";
import { sendMail } from "@/lib/mail";
import { usd } from "@/lib/format";
import { CITY_COORDS } from "@/lib/content";
import { loadRules } from "@/lib/rules";

/** Our price-book services → competitor-intel service tags. */
const TAG: Record<string, string> = { softwash: "softwash_house" };

export const POST = route(async (req) => {
  const b = await req.json();
  const name = str(b.name, 120), email = str(b.email, 200).toLowerCase(), city = str(b.city, 60);
  if (!name || !isEmail(email)) throw bad("Name and a valid email are required");
  const input: QuoteInput = {
    property: b.property === "commercial" ? "commercial" : "residential",
    stories: (String(b.stories) in HEIGHT ? String(b.stories) : "1") as QuoteInput["stories"],
    soil: b.soil in SOIL ? b.soil : "moderate",
    frequency: b.frequency in FREQUENCY ? b.frequency : "one_time",
    afterHours: !!b.afterHours,
    items: (Array.isArray(b.items) ? b.items : []).slice(0, 10).map((i: any) => ({
      service: str(i.service, 40), quantity: Number(i.quantity) || 0, surface: i.surface in SURFACE ? i.surface : "concrete",
    })),
  };
  const result = computeQuote(input, await loadRules());
  if (!result.line_items.length) throw bad("Add at least one service with a size");
  const review = result.needs_review || !!b.manualReview;
  const [lat, lng] = CITY_COORDS[city] ?? CITY_COORDS.Austin;
  const lead = await one(
    `INSERT INTO leads (name,company,email,phone,segment,city,stage,value_cents,source,notes,lat,lng)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'instant quote',$9,$10,$11) RETURNING id`,
    [name, str(b.company, 120) || null, email, str(b.phone, 40) || null, str(b.segment, 40) || (input.property === "commercial" ? "storefront" : "residential"),
     city || "Austin", review ? "new" : "quoted", result.total_cents, str(b.notes, 2000) || null, lat, lng],
  );
  const quote = await one(
    `INSERT INTO quotes (lead_id,input,line_items,total_cents,est_hours,crew_size,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [lead!.id, { ...input, city, address: str(b.address, 200), name, email, company: str(b.company, 120) }, JSON.stringify(result.line_items), result.total_cents, result.est_hours, result.crew_size, review ? "review" : "estimated"],
  );
  // Price-match: a competing quote the prospect chose to share feeds the market-pricing dataset.
  const compPrice = Number(b.competitorPrice);
  if (str(b.competitor) && compPrice > 0 && compPrice < 1e6) {
    const first = input.items.find((i) => i.quantity > 0)!;
    await q(`INSERT INTO market_quotes (competitor,service,quantity,unit,amount_cents,city,source,lead_id,notes) VALUES ($1,$2,$3,$4,$5,$6,'prospect',$7,$8)`,
      [str(b.competitor, 120), TAG[first.service] ?? first.service, input.items.length === 1 ? first.quantity : null, input.items.length === 1 ? (first.service === "gutter" ? "lf" : "sqft") : null,
       Math.round(compPrice * 100), city || null, lead!.id, `Shared via price-match on instant quote; our estimate ${usd(result.total_cents)}`]);
  }
  const lines = result.line_items.map((l) => `• ${l.label}: ${usd(l.amount_cents)}`).join("\n");
  await sendMail(email, review ? "We received your quote request" : `Your Shoal Creek Clean estimate: ${usd(result.total_cents)}`,
    `Hi ${name},\n\n${review ? "A partner will review your request and reply within 24 hours." : "Here is your instant estimate:"}\n\n${lines}\n${result.discount_cents ? `Frequency discount: -${usd(result.discount_cents)}\n` : ""}Total: ${usd(result.total_cents)}\n\nBook online: ${process.env.APP_URL ?? ""}/quote/${quote!.id}\n\n— Shoal Creek Clean`, "quote");
  await sendMail("team@shoalcreek.test", `New ${review ? "REVIEW" : "auto"} quote: ${name} ${usd(result.total_cents)}`, `${name} <${email}> · ${city}\n${lines}`, "internal");
  return { id: quote!.id, ...result, needs_review: review };
});
