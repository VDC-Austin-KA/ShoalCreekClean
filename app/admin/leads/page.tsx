import Link from "next/link";
import { q } from "@/lib/db";
import { Card, Empty, PageHeader, Stat, cx } from "@/components/ui";
import { SEGMENT_LABEL, SEGMENTS } from "@/lib/format";
import { FinderControls, SightingForm } from "./FinderControls";

export const dynamic = "force-dynamic";
export default async function LeadFinder({ searchParams }: { searchParams: Promise<{ segment?: string; min?: string; origin?: string }> }) {
  const sp = await searchParams;
  const min = Math.max(0, Math.min(100, Number(sp.min) || 0));
  const [rows, [stats], jobs] = await Promise.all([
    q(`SELECT l.id, l.company, l.name, l.segment, l.city, l.email, l.phone, l.stage, i.fit_score, i.status, i.origin, i.competitor, i.website, i.people, i.emails, i.phones,
         (l.stage = 'lost' AND l.notes LIKE '%DO NOT CONTACT%') AS dnc
       FROM lead_intel i JOIN leads l ON l.id = i.lead_id
       WHERE i.fit_score >= $1 AND ($2 = '' OR l.segment = $2) AND ($3 = '' OR i.origin = $3)
       ORDER BY dnc, i.fit_score DESC, l.company LIMIT 300`, [min, sp.segment ?? "", sp.origin ?? ""]),
    q(`SELECT COUNT(*) AS total, SUM(status = 'enriched') AS enriched, SUM(json_array_length(emails) > 0) AS with_email,
         SUM(json_array_length(phones) > 0) AS with_phone, SUM(competitor IS NOT NULL) AS competitor_clients FROM lead_intel`),
    q("SELECT kind, status, COUNT(*) AS n FROM finder_jobs GROUP BY kind, status"),
  ]);
  const queued = jobs.filter((j) => j.status === "queued").reduce((s, j) => s + j.n, 0);
  const qs = (o: Record<string, string>) => "?" + new URLSearchParams({ ...(sp.segment ? { segment: sp.segment } : {}), ...(sp.origin ? { origin: sp.origin } : {}), ...(min ? { min: String(min) } : {}), ...o });
  return (
    <div className="space-y-6">
      <PageHeader title="Lead finder" sub="Researched by the external lead-finder Worker from public business data, ranked by fit. Open a lead for its call/email brief." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Researched leads" value={stats.total ?? 0} sub={`${stats.enriched ?? 0} websites read`} />
        <Stat label="With email" value={stats.with_email ?? 0} />
        <Stat label="With phone" value={stats.with_phone ?? 0} />
        <Stat label="Competitor clients" value={stats.competitor_clients ?? 0} sub="named on competitor pages" />
        <Stat label="Jobs queued" value={queued} sub="runs every 10 min" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Find more leads"><FinderControls /></Card>
        <Card title="Log a competitor sighting"><SightingForm /><p className="mt-3 text-xs text-slate-500">Saw a competitor's truck or yard sign at a property? Log it here. The brief will offer a free side-by-side test area.</p></Card>
      </div>
      <Card title="Leads" action={
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[["", "All"], ...SEGMENTS.filter((s) => s !== "residential" && s !== "hoa").map((s) => [s, SEGMENT_LABEL[s]])].map(([s, label]) => (
            <Link key={s} href={qs({ segment: s })} className={cx("chip", (sp.segment ?? "") === s ? "border-accent text-accent" : "border-ink-700 text-slate-400")}>{label}</Link>
          ))}
          <Link href={qs({ origin: sp.origin === "competitor-site" ? "" : "competitor-site" })} className={cx("chip", sp.origin === "competitor-site" ? "border-accent-2 text-accent-2" : "border-ink-700 text-slate-400")}>Competitor clients</Link>
          <Link href={qs({ min: min ? "" : "50" })} className={cx("chip", min ? "border-accent-2 text-accent-2" : "border-ink-700 text-slate-400")}>Fit ≥ 50</Link>
        </div>}>
        {rows.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs font-medium text-slate-500"><tr><th className="py-2">Fit</th><th>Business</th><th>Segment</th><th>Contact</th><th>Reach</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-ink-700">
              {rows.map((r) => (
                <tr key={r.id} className={cx("transition-colors hover:bg-ink-850", r.dnc && "opacity-40")}>
                  <td className="py-2.5"><span className={cx("chip tabular-nums", r.fit_score >= 70 ? "border-lime-400/40 text-lime-300" : r.fit_score >= 45 ? "border-accent/40 text-accent" : "border-ink-700 text-slate-400")}>{r.fit_score}</span></td>
                  <td><Link href={`/admin/leads/${r.id}`} className="font-medium text-slate-100 hover:text-accent">{r.company}</Link>
                    <div className="text-xs text-slate-500">{r.city}{r.competitor ? <span className="text-accent-2"> · {r.competitor} client</span> : ""}</div></td>
                  <td className="text-slate-400">{SEGMENT_LABEL[r.segment] ?? r.segment}</td>
                  <td className="text-slate-300">{r.people[0] ? `${r.people[0].name}` : "—"}<div className="text-xs text-slate-500">{r.people[0]?.title}</div></td>
                  <td className="whitespace-nowrap text-xs text-slate-400">{[r.emails.length && "Email", r.phones.length && "Phone", r.website && "Web"].filter(Boolean).join(" · ") || "Research"}</td>
                  <td className="text-xs text-slate-500">{r.dnc ? "do not contact" : r.stage === "new" ? r.status.replace("_", " ") : r.stage}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : <Empty>No researched leads yet. Queue a discovery run above; the lead finder picks it up within 10 minutes.</Empty>}
      </Card>
      <p className="text-xs text-slate-600">Sources: OpenStreetMap (© OpenStreetMap contributors, ODbL), businesses&apos; own public websites (robots.txt honored) and competitors&apos; public testimonial pages. Only published business contact details are stored; see /bot.</p>
    </div>
  );
}
