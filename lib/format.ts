export const usd = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 });
export const dt = (d: string | Date | null, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) =>
  d ? new Date(d).toLocaleString("en-US", { timeZone: "America/Chicago", ...opts }) : "—";
export const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled", en_route: "En route", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
export const STATUS_FLOW = ["scheduled", "en_route", "in_progress", "completed"] as const;
export const FREQ_LABEL: Record<string, string> = { one_time: "One-time", biannual: "Bi-annual", quarterly: "Quarterly", monthly: "Monthly" };
export const SEGMENTS = ["property_management", "hoa", "retail_center", "restaurant", "storefront", "office_park", "multifamily", "residential"] as const;
export const SEGMENT_LABEL: Record<string, string> = {
  property_management: "Property management", hoa: "HOA", retail_center: "Retail center", restaurant: "Restaurant",
  storefront: "Single storefront", office_park: "Office park", multifamily: "Multifamily", residential: "Residential",
};
