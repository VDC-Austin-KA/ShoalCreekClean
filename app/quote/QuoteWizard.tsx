"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeQuote, DEFAULT_RULES, SURFACE, type QuoteInput, type QuoteResult, type Rule } from "@/lib/pricing";
import { usd, SEGMENTS, SEGMENT_LABEL } from "@/lib/format";
import { CITIES } from "@/lib/content";
import { api } from "@/lib/client-fetch";
import { cx } from "@/components/ui";

type Item = { service: string; quantity: number; surface: keyof typeof SURFACE };
const STEPS = ["Property", "Services", "Details", "Estimate"];

export function QuoteWizard({ initialType }: { initialType?: string }) {
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    property: (initialType === "commercial" ? "commercial" : "residential") as QuoteInput["property"],
    segment: initialType === "commercial" ? "storefront" : "residential",
    city: "Austin", address: "", company: "", name: "", email: "", phone: "", notes: "",
    stories: "1" as QuoteInput["stories"], soil: "moderate" as QuoteInput["soil"], frequency: "one_time" as QuoteInput["frequency"], afterHours: false, manualReview: false,
  });
  const [items, setItems] = useState<Item[]>([{ service: initialType === "commercial" ? "flatwork" : "driveway", quantity: 1500, surface: "concrete" }]);
  const [done, setDone] = useState<(QuoteResult & { id: string }) | null>(null);
  const [booked, setBooked] = useState<{ date: string; portalLink?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [date, setDate] = useState(() => new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));

  useEffect(() => { api("/api/pricing").then((d) => setRules(d.rules)).catch(() => {}); }, []);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const live = useMemo(() => computeQuote({ ...f, items }, rules), [f, items, rules]);
  const unit = (s: string) => rules.find((r) => r.service === s)?.unit ?? "sqft";

  async function submit() {
    setErr(""); setBusy(true);
    try { setDone(await api("/api/quote", { ...f, items })); setStep(3); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function book() {
    setBusy(true); setErr("");
    try { setBooked(await api(`/api/quote/${done!.id}/accept`, { date })); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  const canNext = step === 0 ? !!f.city : step === 1 ? items.some((i) => i.quantity > 0) : !!f.name && /\S+@\S+\.\S+/.test(f.email);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="glass p-6 sm:p-8">
        <ol className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={cx("h-1 rounded-full transition-all duration-700 ease-(--ease-spring)", i <= step ? "bg-accent" : "bg-white/10")} />
              <div className={cx("mt-2 text-xs", i === step ? "text-accent" : "text-slate-500")}>{i + 1}. {s}</div>
            </li>
          ))}
        </ol>

        <div key={step} className="animate-rise">
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <span className="label">Property type</span>
                <div className="grid grid-cols-2 gap-3">
                  {(["commercial", "residential"] as const).map((p) => (
                    <button key={p} type="button" onClick={() => { set("property", p); set("segment", p === "commercial" ? "storefront" : "residential"); }}
                      className={cx("glass lift p-5 text-left capitalize", f.property === p && "border-accent/60 bg-accent/5")}>
                      <div className="text-2xl">{p === "commercial" ? "🏢" : "🏡"}</div>
                      <div className="mt-2 font-semibold text-white">{p}</div>
                    </button>
                  ))}
                </div>
              </div>
              {f.property === "commercial" && (
                <div><label className="label">Business type</label>
                  <select className="input" value={f.segment} onChange={(e) => set("segment", e.target.value)}>
                    {SEGMENTS.filter((s) => s !== "residential").map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}
                  </select></div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">City</label>
                  <select className="input" value={f.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label className="label">Street address (optional)</label><input className="input" value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="123 Congress Ave" /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {items.map((it, idx) => (
                <div key={idx} className="grid gap-3 rounded-xl border border-white/10 bg-ink-900/50 p-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
                  <div><label className="label">Service</label>
                    <select className="input" value={it.service} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, service: e.target.value } : x))}>
                      {rules.map((r) => <option key={r.service} value={r.service}>{r.label}{r.phase > 1 ? " (new)" : ""}</option>)}
                    </select></div>
                  <div><label className="label">{unit(it.service) === "lf" ? "Linear feet" : "Square feet"}</label>
                    <input className="input tabular-nums" type="number" min={0} value={it.quantity || ""} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, quantity: +e.target.value } : x))} /></div>
                  <div><label className="label">Surface</label>
                    <select className="input capitalize" value={it.surface} onChange={(e) => setItems(items.map((x, i) => i === idx ? { ...x, surface: e.target.value as Item["surface"] } : x))}>
                      {Object.keys(SURFACE).map((s) => <option key={s}>{s}</option>)}
                    </select></div>
                  <button type="button" className="btn-ghost btn-sm h-10" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              ))}
              <button type="button" className="btn-ghost btn-sm" onClick={() => setItems([...items, { service: "storefront", quantity: 500, surface: "concrete" }])}>+ Add service</button>
              <p className="text-xs text-slate-500">Tip: a standard parking space is ~160 sq ft; a two-car driveway is ~600 sq ft. Not sure? Estimate and request a manual review.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className="label">Building height</label>
                  <select className="input" value={f.stories} onChange={(e) => set("stories", e.target.value as QuoteInput["stories"])}>
                    <option value="1">1 story</option><option value="2">2 stories</option><option value="3">3 stories</option><option value="4">4+ stories</option>
                  </select></div>
                <div><label className="label">Soil level</label>
                  <select className="input" value={f.soil} onChange={(e) => set("soil", e.target.value as QuoteInput["soil"])}>
                    <option value="light">Light</option><option value="moderate">Moderate</option><option value="heavy">Heavy (oil / gum / rust)</option>
                  </select></div>
                <div><label className="label">Frequency</label>
                  <select className="input" value={f.frequency} onChange={(e) => set("frequency", e.target.value as QuoteInput["frequency"])}>
                    <option value="one_time">One-time</option><option value="biannual">Bi-annual (−8%)</option><option value="quarterly">Quarterly (−15%)</option><option value="monthly">Monthly (−22%)</option>
                  </select></div>
              </div>
              {f.property === "commercial" && (
                <label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" className="size-4 accent-cyan-400" checked={f.afterHours} onChange={(e) => set("afterHours", e.target.checked)} /> After-hours / overnight service (+15%)</label>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="label">Your name</label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
                <div><label className="label">Email</label><input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
                <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                {f.property === "commercial" && <div><label className="label">Company</label><input className="input" value={f.company} onChange={(e) => set("company", e.target.value)} /></div>}
              </div>
              <div><label className="label">Notes</label><textarea className="input min-h-20" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Access, gate codes, problem areas…" /></div>
              <label className="flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" className="size-4 accent-cyan-400" checked={f.manualReview} onChange={(e) => set("manualReview", e.target.checked)} /> I&apos;d like a partner to review on-site before booking</label>
            </div>
          )}

          {step === 3 && done && (
            <div className="space-y-5">
              {done.needs_review ? (
                <div className="rounded-xl border border-violet-400/30 bg-violet-400/10 p-5">
                  <div className="font-semibold text-violet-200">Submitted for partner review</div>
                  <p className="mt-1 text-sm text-violet-200/70">We&apos;ll confirm within 24 hours. Preliminary estimate: <b>{usd(done.total_cents)}</b>.</p>
                  {done.review_reasons.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-violet-200/60">{done.review_reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
                </div>
              ) : booked ? (
                <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-5">
                  <div className="font-semibold text-lime-200">You&apos;re booked for {booked.date} 🎉</div>
                  <p className="mt-1 text-sm text-lime-200/70">A portal login link was emailed to {f.email}.</p>
                  {booked.portalLink && <a href={booked.portalLink} className="btn-primary btn-sm mt-3">Open client portal (alpha link)</a>}
                </div>
              ) : (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
                  <div className="text-sm text-slate-400">Your instant estimate</div>
                  <div className="text-4xl font-semibold text-white tabular-nums">{usd(done.total_cents)}</div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <div><label className="label">Preferred date</label><input type="date" className="input" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></div>
                    <button className="btn-primary" disabled={busy} onClick={book}>{busy ? "Booking…" : "Book this service"}</button>
                  </div>
                </div>
              )}
              <Link href="/" className="text-sm text-slate-400 hover:text-accent">← Back to home</Link>
            </div>
          )}
        </div>

        {err && <p className="mt-4 text-sm text-rose-400">{err}</p>}
        {step < 3 && (
          <div className="mt-8 flex justify-between">
            <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < 2 ? <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</button>
              : <button className="btn-primary" disabled={!canNext || busy} onClick={submit}>{busy ? "Calculating…" : "Get my quote"}</button>}
          </div>
        )}
      </div>

      <aside className="glass h-fit p-6 lg:sticky lg:top-6">
        <div className="text-xs uppercase tracking-wider text-slate-400">Live estimate</div>
        <div className="mt-1 text-4xl font-semibold text-white tabular-nums transition-all">{usd((done ?? live).total_cents)}</div>
        <ul className="mt-4 space-y-2 text-sm">
          {(done ?? live).line_items.map((l, i) => (
            <li key={i} className="flex justify-between gap-3"><span className="text-slate-400">{l.label}{l.note && <span className="block text-[11px] text-slate-600">{l.note}</span>}</span><span className="tabular-nums">{usd(l.amount_cents)}</span></li>
          ))}
          {(done ?? live).discount_cents > 0 && <li className="flex justify-between text-accent-2"><span>Frequency discount</span><span>−{usd((done ?? live).discount_cents)}</span></li>}
        </ul>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/5 pt-4 text-xs text-slate-500">
          <div>On-site time<div className="text-sm text-slate-200">~{live.est_hours} hr</div></div>
          <div>Crew size<div className="text-sm text-slate-200">{live.crew_size} tech{live.crew_size > 1 && "s"}</div></div>
        </div>
        {live.needs_review && step < 3 && <p className="mt-4 text-xs text-violet-300">This job will route to a partner for review.</p>}
      </aside>
    </div>
  );
}
