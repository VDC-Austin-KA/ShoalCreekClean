// Marketing copy. PLACEHOLDER: testimonials and credentials below are alpha preview content —
// replace with real, verifiable client quotes and your actual insurance/certifications before public launch.
export const TESTIMONIALS = [
  { quote: "The before/after photos in the portal made it easy to show our owners exactly what we paid for.", who: "Property manager", where: "Austin (sample)" },
  { quote: "They washed our whole strip center overnight. Tenants opened to clean sidewalks and nobody lost a sale.", who: "Retail center manager", where: "Round Rock (sample)" },
  { quote: "Got a quote in two minutes on my phone and the crew was out that week.", who: "Restaurant owner", where: "Pflugerville (sample)" },
];
export const CREDENTIALS = [
  { title: "Fully insured", body: "General liability & commercial auto. COI on request." },
  { title: "Wash-water reclamation", body: "Berms and reclaim mats on commercial lots." },
  { title: "OSHA-aligned safety", body: "Fall protection & lift-trained crews for height work." },
  { title: "Photo-verified work", body: "Timestamped before/after proof on every job." },
];
export const SERVICES = [
  { icon: "▦", title: "Commercial flatwork", body: "Parking lots, garages, sidewalks, plazas, dumpster pads — hot water and surface cleaners." },
  { icon: "▤", title: "Storefronts & entries", body: "Gum, grease and stain removal before you open. Overnight crews available." },
  { icon: "⌂", title: "Residential", body: "Driveways, patios, pool decks and house washes with instant online pricing." },
  { icon: "◈", title: "Soft wash & siding", body: "Low-pressure treatment for stucco, brick, siding and roofs.", soon: true },
  { icon: "≋", title: "Gutter cleaning", body: "Commercial and multi-story gutters with downspout flush.", soon: true },
  { icon: "◆", title: "Sealing & maintenance plans", body: "Paver/concrete sealing and recurring preventive contracts.", soon: true },
];
export const CITIES = ["Austin", "Round Rock", "Pflugerville", "Cedar Park", "Leander", "Georgetown", "Hutto", "Buda", "Kyle"];
export const CITY_COORDS: Record<string, [number, number]> = {
  Austin: [30.2672, -97.7431], "Round Rock": [30.5083, -97.6789], Pflugerville: [30.4394, -97.62], "Cedar Park": [30.5052, -97.8203],
  Leander: [30.5788, -97.8531], "Del Valle": [30.1935, -97.6141], Georgetown: [30.6333, -97.677], Hutto: [30.5427, -97.5467], Buda: [30.0852, -97.8403], Kyle: [29.9891, -97.8772],
};
