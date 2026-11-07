// America/Chicago time helpers. D1/SQLite has no time-zone support, so all Central-time math happens here.
// Timestamps are stored as UTC ISO strings.
const TZ = "America/Chicago";

/** Minutes east of UTC for the given instant in Central time (e.g. -360 in CST, -300 in CDT). */
function offsetMinutes(at: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(at).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Central-time wall clock (YYYY-MM-DD + HH:MM) → UTC ISO string. DST-safe. */
export function ctToUtc(date: string, time = "08:00"): string {
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let t = wall - offsetMinutes(new Date(wall)) * 60000;
  t = wall - offsetMinutes(new Date(t)) * 60000; // second pass settles DST boundaries
  return new Date(t).toISOString();
}

/** Central-time calendar date (YYYY-MM-DD) of an instant. */
export const ctDate = (at: Date | string = new Date()) => new Date(at).toLocaleDateString("en-CA", { timeZone: TZ });
/** Central-time wall clock HH:MM (24h) of an instant. */
export const ctClock = (at: Date | string) => new Date(at).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
/** "8:00 am" style label. */
export const ctTimeLabel = (at: Date | string | null) =>
  at ? new Date(at).toLocaleTimeString("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" }).toLowerCase() : null;

export const addDays = (iso: string, n: number) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** [start, end) UTC ISO bounds of a Central-time calendar day, or a range of days. */
export const ctDayBounds = (date: string, days = 1): [string, string] => [ctToUtc(date, "00:00"), ctToUtc(addDays(date, days), "00:00")];

/** Monday (Central time) of the week containing `date` (default today). */
export function weekStart(date?: string) {
  const base = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ctDate();
  const day = (new Date(base + "T12:00:00Z").getUTCDay() + 6) % 7;
  return addDays(base, -day);
}
export const isoDay = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
export const isoClock = (s: unknown) => (typeof s === "string" && /^\d{2}:\d{2}$/.test(s) ? s : null);
