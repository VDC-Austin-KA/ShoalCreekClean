import { STORY, founderIntro } from "./story.ts";
// Deterministic outreach strategy generator: segment × portfolio size × city × season.
export type StrategyInput = { segment: string; size: "single" | "small" | "portfolio"; city: string; month: number };
export type Strategy = {
  headline: string;
  decisionMaker: string;
  angle: string;
  offer: string;
  tactics: string[];
  cadence: { day: number; channel: string; action: string }[];
  email: { subject: string; body: string };
  callOpener: string;
  collateral: string[];
  objections: { q: string; a: string }[];
};

const PROFILES: Record<string, { dm: string; pain: string; angle: string; proof: string; service: string }> = {
  property_management: { dm: "Regional property manager / facilities director", pain: "tenant complaints, curb appeal at lease renewals, vendor no-shows", angle: "one vendor, every property, photo-verified on a fixed calendar", proof: "portfolio dashboard with timestamped before/after photos per site", service: "quarterly flatwork + breezeway program" },
  hoa: { dm: "HOA board president / community manager", pain: "amenity center grime, entry monument staining, budget scrutiny from residents", angle: "board-ready fixed annual pricing with documented results for the newsletter", proof: "before/after report the board can share at the next meeting", service: "bi-annual common-area + monument wash" },
  retail_center: { dm: "Center manager / asset manager", pain: "gum, oil stains and dumpster pads hurting shopper perception and anchor-tenant relations", angle: "overnight service so no tenant ever loses a trading hour", proof: "after-hours crews with zero-disruption guarantee and photo proof by 7am", service: "monthly overnight flatwork + dumpster pads" },
  restaurant: { dm: "Owner / GM / multi-unit ops manager", pain: "grease at drive-thru and dumpster pads, health inspections, slip hazards", angle: "grease-cutting hot water before inspection season, scheduled after close", proof: "inspection-ready log with photos per visit", service: "monthly drive-thru, patio and dumpster pad degrease" },
  storefront: { dm: "Owner-operator", pain: "first impression, sidewalk gum and stains, limited time to manage vendors", angle: "instant online quote, done before you open", proof: "same-week scheduling with a photo text when finished", service: "quarterly storefront + sidewalk wash" },
  office_park: { dm: "Facilities manager / building engineer", pain: "parking structure grime, entry plazas, tenant experience scores", angle: "preventive maintenance calendar that fits the facilities budget cycle", proof: "per-building service history and compliance-friendly wash-water reclamation", service: "quarterly garage + plaza program" },
  multifamily: { dm: "Community manager / regional manager", pain: "breezeways, stairwells, pool decks before leasing season", angle: "lease-up season refresh that photographs well for listings", proof: "listing-ready after photos delivered same day", service: "bi-annual breezeway + amenity wash" },
  residential: { dm: "Homeowner", pain: "pollen, mildew, driveway stains", angle: "transparent instant pricing and online booking", proof: "before/after photos and satisfaction guarantee", service: "driveway + house soft wash" },
};

function season(month: number) {
  if (month >= 2 && month <= 4) return { name: "pollen season", hook: "Oak and cedar pollen season is coating every surface in Central Texas" };
  if (month >= 5 && month <= 8) return { name: "summer", hook: "Summer storms and heat are baking grime and algae into concrete" };
  if (month >= 9 && month <= 10) return { name: "fall reset", hook: "Post-summer grime is peaking before the holiday traffic season" };
  return { name: "holiday prep", hook: "Holiday shoppers and year-end inspections are coming up" };
}

export function generateStrategy(i: StrategyInput): Strategy {
  const p = PROFILES[i.segment] ?? PROFILES.storefront;
  const s = season(i.month);
  const scale = i.size === "portfolio" ? "portfolio-wide" : i.size === "small" ? "multi-site" : "single-site";
  const offer =
    i.size === "portfolio"
      ? `Free pilot clean on one property + 15% off a 12-month ${p.service} across the portfolio`
      : i.size === "small"
        ? `10% off the first quarter of a ${p.service} when 2+ sites sign`
        : `$75 off the first ${p.service.split(" ")[0]} service, booked online`;
  return {
    headline: `${scale[0].toUpperCase() + scale.slice(1)} ${p.service} pitch for ${i.city} (${s.name})`,
    decisionMaker: p.dm,
    angle: p.angle,
    offer,
    tactics: [
      `Build a list of 40 ${i.city} targets; pull decision-maker names from LinkedIn and county appraisal records.`,
      `Lead with the pain: ${p.pain}.`,
      `Show the proof: ${p.proof}.`,
      i.size === "portfolio" ? "Request a 20-minute walk-through of the worst-performing property; quote it on-site from the app." : "Drop a printed leave-behind with a QR code to the instant-quote page.",
      `Time it to ${s.name}: ${s.hook.toLowerCase()}.`,
      "Log every touch in the CRM pipeline; move to Quoted within 24 hours of first conversation.",
    ],
    cadence: [
      { day: 1, channel: "Email", action: "Personalized intro email (template below)" },
      { day: 3, channel: "Phone", action: "Call opener; offer a free site photo-assessment" },
      { day: 6, channel: i.size === "single" ? "In person" : "LinkedIn", action: i.size === "single" ? "Door drop with leave-behind" : "Connection note referencing the email" },
      { day: 10, channel: "Email", action: "Follow-up with a before/after photo from a nearby job" },
      { day: 17, channel: "Phone", action: "Final call — offer expires end of month" },
    ],
    email: {
      subject: `${s.name === "pollen season" ? "Pollen season" : "Quick idea"} for {{company}}'s curb appeal`,
      body: `Hi {{first_name}},\n\n${s.hook}. ${founderIntro(i.city)} What we offer: ${p.angle}.\n\nFor {{company}} we'd suggest a ${p.service}. Every visit includes ${p.proof}.\n\nOffer: ${offer}.\n\nWorth a 15-minute call this week? Or get an instant estimate at {{quote_url}}.\n\n— Shoal Creek Clean`,
    },
    callOpener: `Hi, this is ___ with Shoal Creek Clean here in ${i.city}. ${STORY.short} — ${STORY.why}. I help ${p.dm.split(" /")[0].toLowerCase()}s with ${p.pain.split(",")[0]}. Do you have a minute?`,
    collateral: [
      `One-page sell sheet: "${p.service}" with 3 before/after pairs`,
      "Sample client-portal screenshot showing job history and photo proof",
      "Certificate of insurance + W-9 ready to send on request",
      i.size === "portfolio" ? "Portfolio pricing grid (per-site, quarterly vs monthly)" : "QR-code door hanger to the instant quote",
    ],
    objections: [
      { q: "We already have a vendor.", a: "Totally fair — we'll do one property free so you can compare photo-for-photo." },
      { q: "It's not in this year's budget.", a: "Quarterly billing spreads it out, and we can start the program at your next budget cycle with a locked rate." },
      { q: "What about wash water runoff?", a: "We use reclaim mats and berms on commercial lots and handle wash water per City of Austin guidance." },
    ],
  };
}
