// Pre-call / pre-email brief for one lead: the goal of the conversation, who to ask for, an honest
// founder-voice opener, the offer, discovery questions, objection handling and a ready-to-send email.
// Pure; shared by the app (CRM lead page) and the lead finder.
import { STORY, founderIntro } from "./story.ts";

export type BriefInput = {
  company: string;
  segment: string;
  city?: string | null;
  contactName?: string | null;
  contactTitle?: string | null;
  competitor?: string | null;
  category?: string | null;
  hasEmail?: boolean;
  hasPhone?: boolean;
};
export type Brief = {
  goal: string;
  askFor: string;
  channel: "call" | "email" | "visit";
  opener: string;
  pitch: string;
  offer: string;
  questions: string[];
  objections: { q: string; a: string }[];
  email: { subject: string; body: string };
  voicemail: string;
  compliance: string[];
};

const ROLES: Record<string, { ask: string; pain: string; service: string }> = {
  property_management: { ask: "the property manager or facilities coordinator for this site", pain: "tenant complaints and curb appeal before renewals", service: "a quarterly flatwork and breezeway program" },
  hoa: { ask: "the community manager (or the board member who handles common areas)", pain: "amenity and entry-monument grime residents notice", service: "a twice-a-year common-area and monument wash" },
  retail_center: { ask: "the center or property manager", pain: "gum, oil stains and dumpster pads that shoppers see", service: "overnight flatwork and dumpster-pad cleaning" },
  restaurant: { ask: "the owner or general manager", pain: "grease on the drive-thru, patio and dumpster pad, especially before inspections", service: "a monthly after-close degrease" },
  office_park: { ask: "the facilities or building manager", pain: "entry plazas and garages that tenants walk through every day", service: "a quarterly plaza and garage program" },
  multifamily: { ask: "the community manager", pain: "breezeways and pool decks before leasing season", service: "a twice-a-year breezeway and amenity wash" },
  storefront: { ask: "the owner or store manager", pain: "the sidewalk and entry customers see first", service: "a quarterly storefront and sidewalk wash" },
  residential: { ask: "the homeowner", pain: "pollen, mildew and driveway stains", service: "a driveway and house wash" },
};

export function generateBrief(i: BriefInput): Brief {
  const r = ROLES[i.segment] ?? ROLES.storefront;
  const city = i.city || "Austin";
  const who = i.contactName ? `${i.contactName}${i.contactTitle ? ` (${i.contactTitle})` : ""}` : r.ask;
  const first = i.contactName?.split(" ")[0];
  const offer = i.competitor
    ? "A free side-by-side test area on your property, so you can compare our results with your current vendor before changing anything"
    : "A free pilot clean of one problem area (an entry, a dumpster pad or a stretch of sidewalk), then a written quote for a regular program";
  const goal = i.competitor
    ? `Get permission to clean a small free test area so ${i.company} can compare us with their current exterior vendor (${i.competitor}). Don't ask them to switch on this call.`
    : `Book a 15-minute site walk or a free pilot clean at ${i.company}, and learn who signs off on exterior maintenance and when the budget is set.`;
  const opener = `Hi${first ? ` ${first}` : ""}, this is ___ with Shoal Creek Clean. ${STORY.short} — ${STORY.why}. I'm calling local ${i.segment === "restaurant" ? "restaurants" : "properties"} in ${city} because we're looking for a few places to prove ourselves on. Do you have a minute, or is there a better time?`;
  return {
    goal,
    askFor: who,
    channel: i.hasPhone ? "call" : i.hasEmail ? "email" : "visit",
    opener,
    pitch: `Most ${i.segment.replace("_", " ")} sites we talk to deal with ${r.pain}. We'd suggest ${r.service}. ${STORY.techEdge}.`,
    offer,
    questions: [
      "Who handles exterior cleaning today, and how often does it happen?",
      "Which spot gets the most complaints — entry, sidewalks, dumpster pad, parking?",
      "Who approves vendor changes, and when is next year's maintenance budget set?",
      "Is overnight or after-hours service important for you?",
      i.competitor ? `What would you change about your current service (no need to name names)?` : "Have you ever had it professionally cleaned? How did it go?",
    ],
    objections: [
      { q: "We already have someone.", a: "Totally fair. That's exactly why we offer a free test area: if we're not clearly better, you've lost nothing." },
      { q: "Send me something.", a: "Happy to. What's the best email, and which spot would you most like to see cleaned?" },
      { q: "Not in the budget.", a: "Understood. When is the budget set? We can price a program now and start when it opens up." },
      { q: "Are you insured?", a: "Yes. We'll send the certificate of insurance and a W-9 with the proposal." },
    ],
    email: {
      subject: `A local idea for ${i.company}'s curb appeal`,
      body: [
        `Hi ${first ?? "there"},`,
        "",
        founderIntro(city),
        "",
        `For ${i.company} we'd suggest ${r.service}. Offer: ${offer.charAt(0).toLowerCase() + offer.slice(1)}.`,
        "",
        "Would a 15-minute walk-through this week or next work? Or reply with the spot that bugs you most and we'll send a price.",
        "",
        STORY.signoff,
      ].join("\n"),
    },
    voicemail: `Hi, this is ___ from Shoal Creek Clean, a locally run exterior cleaning company here in ${city}. We'd love to do a free pilot clean at ${i.company} so you can see our work. Call or text me back at ___. Thanks!`,
    compliance: [
      "Dial by hand. Don't use an autodialer or prerecorded message, and don't text a number unless they've given you permission.",
      "If they ask not to be contacted, mark the lead Do Not Contact immediately.",
      "Emails must include our physical mailing address and a working unsubscribe link (the campaign tool adds both).",
      i.competitor ? "Never disparage the competitor or claim to know their prices or contract terms." : "Be specific and honest. Don't claim certifications or past clients we don't have.",
    ],
  };
}
