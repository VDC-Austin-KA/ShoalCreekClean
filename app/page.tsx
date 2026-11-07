import Link from "next/link";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Logo } from "@/components/ui";
import { CITIES, CREDENTIALS, SERVICES, TESTIMONIALS } from "@/lib/content";

export default function Home() {
  return (
    <div className="overflow-x-clip">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            <a href="#services" className="hidden px-3 py-2 text-slate-400 hover:text-white sm:block">Services</a>
            <a href="#proof" className="hidden px-3 py-2 text-slate-400 hover:text-white sm:block">Results</a>
            <Link href="/login" className="btn-ghost btn-sm">Client login</Link>
            <Link href="/quote" className="btn-primary btn-sm">Instant quote</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="animate-rise">
          <span className="chip border-accent/30 bg-accent/10 text-accent">Now booking · Greater Austin</span>
          <h1 className="headline mt-5 text-4xl leading-[1.05] sm:text-6xl">
            Commercial power washing,<br /><span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">photo-verified.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-400">
            Parking lots, storefronts, HOAs and retail centers across Austin, Round Rock, Pflugerville and Cedar Park.
            Instant quotes, automated scheduling, and timestamped before/after proof on every job.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote" className="btn-primary px-6 py-3 text-base">Get an instant quote →</Link>
            <Link href="/quote?type=commercial" className="btn-ghost px-6 py-3 text-base">Commercial walkthrough</Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[["< 2 min", "online estimate"], ["24 hr", "quote turnaround"], ["100%", "jobs photo-verified"]].map(([v, l]) => (
              <div key={l}><dt className="text-2xl font-semibold text-white">{v}</dt><dd className="text-xs text-slate-500">{l}</dd></div>
            ))}
          </dl>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <BeforeAfter label="Drag to compare — paver plaza" />
        </div>
      </section>

      <section className="border-y border-white/5 bg-ink-900/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {CREDENTIALS.map((c) => (
            <div key={c.title} className="flex gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-2/10 text-accent-2">✓</span>
              <div><div className="text-sm font-semibold text-white">{c.title}</div><div className="text-xs text-slate-500">{c.body}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="headline text-3xl">Services</h2>
        <p className="mt-2 text-slate-400">Commercial-first, with residential and maintenance plans.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div key={s.title} className="glass lift p-6 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <span className="text-2xl text-accent">{s.icon}</span>
                {s.soon && <span className="chip border-amber-400/30 text-amber-300">Phase 2</span>}
              </div>
              <h3 className="mt-4 font-semibold text-white">{s.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <BeforeAfter label="Drag to compare — storefront entry" />
          <div>
            <h2 className="headline text-3xl">Proof, not promises.</h2>
            <p className="mt-3 text-slate-400">Crews upload timestamped before/after photos from the field. Clients see them in their portal the moment a job is marked complete — alongside the invoice.</p>
            <ol className="mt-6 space-y-3 text-sm">
              {["Scheduled", "En route", "In progress", "Completed + photo proof"].map((s, i) => (
                <li key={s} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full border border-accent/40 text-xs text-accent">{i + 1}</span>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex items-baseline justify-between"><h2 className="headline text-3xl">What clients say</h2><span className="text-xs text-slate-600">alpha preview content</span></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.quote} className="glass lift p-6">
              <blockquote className="text-slate-200">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-xs text-slate-500">{t.who} · {t.where}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="glass relative overflow-hidden p-10 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_50%_120%,rgb(34_211_238/0.18),transparent)]" />
          <h2 className="headline text-3xl">Serving Central Texas</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{CITIES.join(" · ")}</p>
          <Link href="/quote" className="btn-primary mt-8 px-6 py-3 text-base">Price my property →</Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Shoal Creek Clean · Austin, Texas · <Link href="/login" className="hover:text-accent">Team login</Link>
      </footer>
    </div>
  );
}
