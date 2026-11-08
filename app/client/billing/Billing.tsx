"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-fetch";
import { cx } from "@/components/ui";

type M = { id: string; kind: string; label: string; is_default: boolean };

export function PayButton({ id, stripe, methods }: { id: string; stripe: boolean; methods: M[] }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  async function pay() {
    setBusy(true);
    try {
      const res = await api(`/api/client/invoices/${id}/pay`, stripe && !method ? {} : { methodId: method || undefined });
      if (res.redirect) window.location.href = res.redirect; else r.refresh();
    } catch (e: any) { alert(e.message); } finally { setBusy(false); }
  }
  return (
    <span className="inline-flex items-center gap-2">
      {(methods.length > 0 || stripe) && (
        <select aria-label="Payment method" className="input w-auto py-1.5 text-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
          {stripe && <option value="">Stripe checkout</option>}
          {methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      )}
      <button className="btn-primary btn-sm" disabled={busy} onClick={pay}>{busy ? "…" : "Pay"}</button>
    </span>
  );
}

export function Methods({ methods }: { methods: M[] }) {
  const r = useRouter();
  const [kind, setKind] = useState<"card" | "ach">("card");
  const [f, setF] = useState({ number: "", exp: "", cvc: "", routing: "", account: "", bank: "" });
  const [msg, setMsg] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    try { await api("/api/client/payment-methods", { kind, ...f }); setF({ number: "", exp: "", cvc: "", routing: "", account: "", bank: "" }); r.refresh(); }
    catch (err: any) { setMsg(err.message); }
  }
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ul className="space-y-2">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900/50 px-4 py-3 text-sm">
            <span><span className="text-slate-500">{m.kind === "ach" ? "Bank" : "Card"}</span> {m.label} {m.is_default && <span className="chip ml-2 border-accent/30 text-accent">default</span>}</span>
            <button className="text-xs text-slate-500 hover:text-rose-400" onClick={async () => { await api("/api/client/payment-methods", { id: m.id }, "DELETE"); r.refresh(); }}>Remove</button>
          </li>
        ))}
        {!methods.length && <li className="text-sm text-slate-500">No saved methods.</li>}
      </ul>
      <form onSubmit={add} className="space-y-3">
        <div className="grid grid-cols-2 rounded-xl bg-ink-900 p-1 text-xs">
          {(["card", "ach"] as const).map((k) => <button type="button" key={k} onClick={() => setKind(k)} className={cx("rounded-lg py-1.5", kind === k ? "bg-ink-700 text-white" : "text-slate-500")}>{k === "card" ? "Credit card" : "Bank (ACH)"}</button>)}
        </div>
        {kind === "card" ? (
          <>
            <input className="input" inputMode="numeric" placeholder="Card number (test: 4242 4242 4242 4242)" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><input className="input" placeholder="MM/YY" value={f.exp} onChange={(e) => setF({ ...f, exp: e.target.value })} /><input className="input" placeholder="CVC" value={f.cvc} onChange={(e) => setF({ ...f, cvc: e.target.value })} /></div>
          </>
        ) : (
          <>
            <input className="input" placeholder="Bank name" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} />
            <div className="grid grid-cols-2 gap-3"><input className="input" inputMode="numeric" placeholder="Routing #" value={f.routing} onChange={(e) => setF({ ...f, routing: e.target.value })} /><input className="input" inputMode="numeric" placeholder="Account #" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} /></div>
          </>
        )}
        <button className="btn-ghost w-full">Save {kind === "card" ? "card" : "bank account"}</button>
        {msg && <p className="text-xs text-rose-400">{msg}</p>}
        <p className="text-[11px] text-slate-600">Only the brand and last 4 digits are stored.</p>
      </form>
    </div>
  );
}
