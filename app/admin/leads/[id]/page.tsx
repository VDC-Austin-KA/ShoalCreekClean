import Link from "next/link";
import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { generateBrief, type Brief } from "@/lib/brief";
import { fitScore } from "@/lib/fit";
import { Card, PageHeader, cx } from "@/components/ui";
import { SEGMENT_LABEL } from "@/lib/format";
import { LeadActions, CopyButton } from "./LeadActions";

export const dynamic = "force-dynamic";
const fmtPhone = (p: string) => p.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3");

export default async function LeadBrief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await one(`SELECT l.*, i.website, i.emails, i.phones, i.people, i.company_info, i.origin, i.origin_url, i.competitor, i.fit_score, i.fit_reasons, i.brief, i.status AS intel_status, i.enriched_at,
      EXISTS (SELECT 1 FROM suppressions s WHERE s.contact = 'lead:' || l.id OR s.contact = lower(l.email) OR s.contact = l.phone) AS dnc
    FROM leads l LEFT JOIN lead_intel i ON i.lead_id = l.id WHERE l.id = $1`, [id]);
  if (!l) notFound();
  const emails: { value: string; source: string }[] = l.emails ?? (l.email ? [{ value: l.email, source: "CRM" }] : []);
  const phones: { value: string; source: string }[] = l.phones ?? (l.phone ? [{ value: l.phone, source: "CRM" }] : []);
  const people: { name: string; title: string; source: string }[] = l.people ?? [];
  // Manual CRM leads have no research row: build the brief and score on the fly.
  const brief: Brief = l.brief ?? generateBrief({ company: l.company ?? l.name, segment: l.segment, city: l.city, contactName: l.company ? l.name : null, hasEmail: emails.length > 0, hasPhone: phones.length > 0 });
  const fit = l.fit_score != null ? { score: l.fit_score, reasons: l.fit_reasons } : fitScore({ segment: l.segment, emails, phones });
  const info = l.company_info ?? {};
  const emailBody = `${brief.email.body}\n\n—\nShoal Creek Clean · Austin, TX\nIf you'd rather not hear from us, just reply "no thanks" and we won't reach out again.`;
  const to = emails[0]?.value;
  return (
    <div className="space-y-6">
      <PageHeader title={l.company ?? l.name} sub={`${SEGMENT_LABEL[l.segment] ?? l.segment} · ${l.city ?? "—"}${info.category ? ` · ${info.category}` : ""}${l.competitor ? (l.origin === "field-sighting" ? ` · ${l.competitor} seen working here` : ` · named on ${l.competitor}'s site`) : ""}`}
        action={<Link href="/admin/leads" className="btn-ghost btn-sm">← Lead finder</Link>} />
      {l.dnc ? <div className="glass border-rose-400/40 p-4 text-sm text-rose-300">Do Not Contact: this business asked not to be contacted, or was opted out. Don&apos;t call or email.</div> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card title={<span>Fit <span className={cx("ml-2 chip", fit.score >= 70 ? "border-lime-400/40 text-lime-300" : "border-accent/40 text-accent")}>{fit.score}/100</span></span>}>
            <ul className="space-y-1 text-xs text-slate-400">{fit.reasons.map((r: string) => <li key={r}>· {r}</li>)}</ul>
          </Card>
          <Card title="Contacts (published by the business)">
            <dl className="space-y-3 text-sm">
              {people.length > 0 && <div><dt className="label">People</dt>{people.map((p) => <dd key={p.name} className="text-slate-200">{p.name} <span className="text-slate-500">· {p.title}</span> <a href={p.source} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-accent">source</a></dd>)}</div>}
              <div><dt className="label">Phone</dt>{phones.length ? phones.map((p) => <dd key={p.value}><a href={`tel:${p.value}`} className="text-accent">{fmtPhone(p.value)}</a> <a href={p.source} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-accent">source</a></dd>) : <dd className="text-slate-500">none published</dd>}</div>
              <div><dt className="label">Email</dt>{emails.length ? emails.map((e) => <dd key={e.value} className="text-slate-200">{e.value} <a href={e.source} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-accent">source</a></dd>) : <dd className="text-slate-500">none published</dd>}</div>
              {l.website && <div><dt className="label">Website</dt><dd><a href={l.website} target="_blank" rel="noreferrer" className="text-accent">{l.website}</a></dd></div>}
              {info.address && <div><dt className="label">Address</dt><dd className="text-slate-300">{info.address}</dd></div>}
              {info.description && <div><dt className="label">About</dt><dd className="text-slate-400">{info.description}</dd></div>}
              {info.context && <div><dt className="label">{l.origin === "field-sighting" ? "Field sighting" : "Seen on competitor page"}</dt><dd className="text-slate-400">“{info.context}” <a href={l.origin_url} target="_blank" rel="noreferrer" className="text-xs text-slate-600 hover:text-accent">source</a></dd></div>}
            </dl>
            <p className="mt-4 text-[11px] text-slate-600">Origin: {l.origin ?? "CRM"}{l.origin_url ? <> · <a href={l.origin_url} target="_blank" rel="noreferrer" className="hover:text-accent">{l.origin_url}</a></> : null}{l.enriched_at ? ` · website read ${new Date(l.enriched_at).toLocaleDateString("en-US")}` : ""}</p>
          </Card>
          <Card title="Actions"><LeadActions id={l.id} stage={l.stage} dnc={!!l.dnc} /></Card>
        </div>
        <div className="space-y-6">
          <Card title="Goal for this conversation">
            <p className="text-slate-100">{brief.goal}</p>
            <p className="mt-3 text-sm text-slate-400"><b className="text-slate-300">Ask for:</b> {brief.askFor} · <b className="text-slate-300">Best channel:</b> {brief.channel}</p>
          </Card>
          <Card title="Opener" action={<CopyButton text={brief.opener} />}>
            <p className="italic text-slate-200">“{brief.opener}”</p>
            <p className="mt-3 text-sm text-slate-400">{brief.pitch}</p>
            <p className="mt-3 text-sm text-accent-2"><b>Offer:</b> {brief.offer}</p>
          </Card>
          <Card title="Discovery questions"><ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">{brief.questions.map((x) => <li key={x}>{x}</li>)}</ol></Card>
          <Card title="If they say…"><ul className="space-y-2 text-sm">{brief.objections.map((o) => <li key={o.q}><span className="text-slate-200">“{o.q}”</span><span className="block text-slate-500">→ {o.a}</span></li>)}</ul></Card>
          <Card title="Email draft" action={<div className="flex gap-2"><CopyButton text={`${brief.email.subject}\n\n${emailBody}`} />{to && !l.dnc ? <a className="btn-primary btn-sm" href={`mailto:${to}?subject=${encodeURIComponent(brief.email.subject)}&body=${encodeURIComponent(emailBody)}`}>Open in email</a> : null}</div>}>
            <div className="text-sm font-semibold text-slate-200">{brief.email.subject}</div>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-400">{emailBody}</pre>
          </Card>
          <Card title="Voicemail" action={<CopyButton text={brief.voicemail} />}><p className="text-sm text-slate-300">{brief.voicemail}</p></Card>
          <Card title="Keep it clean (compliance)"><ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">{brief.compliance.map((c) => <li key={c}>{c}</li>)}</ul></Card>
        </div>
      </div>
    </div>
  );
}
