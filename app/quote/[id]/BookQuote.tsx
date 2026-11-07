"use client";
import { useState } from "react";
import { api } from "@/lib/client-fetch";

export function BookQuote({ id }: { id: string }) {
  const [date, setDate] = useState(() => new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10));
  const [res, setRes] = useState<{ date: string; portalLink?: string } | null>(null);
  const [err, setErr] = useState("");
  if (res) return <div className="mt-6 rounded-xl border border-lime-400/30 bg-lime-400/10 p-4 text-sm text-lime-200">Booked for {res.date}. Check your email for your portal link.{res.portalLink && <a className="btn-primary btn-sm ml-3" href={res.portalLink}>Open portal</a>}</div>;
  return (
    <div className="mt-6 flex flex-wrap items-end gap-3">
      <div><label className="label">Preferred date</label><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <button className="btn-primary" onClick={async () => { try { setRes(await api(`/api/quote/${id}/accept`, { date })); } catch (e: any) { setErr(e.message); } }}>Book this service</button>
      {err && <span className="text-sm text-rose-400">{err}</span>}
    </div>
  );
}
