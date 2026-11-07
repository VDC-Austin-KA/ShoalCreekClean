// The founders' story, used in every first-contact script so the voice stays consistent and honest.
// Keep claims factual: no certifications, client names or years-in-business that aren't true.
export const STORY = {
  short: "We're three Austin locals who left 9-to-5 tech jobs to build something hands-on",
  why: "a trade that won't be automated away, and a way to keep the city we grew up in looking as good as it deserves",
  techEdge: "Because we come from tech, every visit is scheduled online, tracked live, and documented with timestamped before/after photos you can see in a client portal",
  value: "Clean storefronts, lots and entries hold their value and tell customers you care — that's what keeping Austin presentable means to us",
  signoff: "— The Shoal Creek Clean team (Austin, TX)",
};

/** One-paragraph founder intro for emails and voicemails. */
export const founderIntro = (city = "Austin") =>
  `${STORY.short} — ${STORY.why}. ${STORY.techEdge}. We're based in ${city === "Austin" ? "Austin" : `the ${city} area`} and we'd rather earn your business with one great visit than a long pitch.`;
