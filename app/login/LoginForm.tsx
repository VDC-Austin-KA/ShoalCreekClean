"use client";
import { useState } from "react";
import { api } from "@/lib/client-fetch";
import { cx } from "@/components/ui";

export function LoginForm({ next, alpha }: { next?: string; alpha: boolean }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok?: boolean; text: string; link?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (mode === "password") {
        const r = await api("/api/auth/login", { email, password });
        window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : r.home;
      } else {
        const r = await api("/api/auth/magic-request", { email });
        setMsg({ ok: true, text: "If that email has an account, a sign-in link is on its way.", link: r.link });
      }
    } catch (err: any) { setMsg({ text: err.message }); } finally { setBusy(false); }
  }
  const demo = (e: string) => { setMode("password"); setEmail(e); setPassword("alpha2026!"); };

  return (
    <div className="glass w-full max-w-md p-8 animate-rise">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-ink-900 p-1 text-sm">
        {(["password", "magic"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={cx("rounded-lg py-2 transition-all duration-300", mode === m ? "bg-white/10 text-white" : "text-slate-500")}>
            {m === "password" ? "Password" : "Magic link"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
        {mode === "password" && <div><label className="label">Password</label><input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "…" : mode === "password" ? "Sign in" : "Email me a link"}</button>
      </form>
      {msg && <p className={cx("mt-4 text-sm", msg.ok ? "text-lime-300" : "text-rose-400")}>{msg.text}</p>}
      {msg?.link && <a className="mt-2 block break-all text-xs text-accent underline" href={msg.link}>Alpha mode: open magic link</a>}
      {alpha && (
        <div className="mt-6 border-t border-white/5 pt-5">
          <div className="text-xs uppercase tracking-wider text-slate-500">Alpha demo accounts · password alpha2026!</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[["Partner (admin)", "ops@shoalcreek.test"], ["Crew lead", "alpha@shoalcreek.test"], ["Commercial client", "client@shoalcreek.test"], ["Residential client", "home@shoalcreek.test"]].map(([l, e]) => (
              <button key={e} type="button" className="btn-ghost btn-sm" onClick={() => demo(e)}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
