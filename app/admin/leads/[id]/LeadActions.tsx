"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <button className="btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? "Copied ✓" : "Copy"}</button>;
}

export function LeadActions({ id, stage, dnc }: { id: string; stage: string; dnc: boolean }) {
  const r = useRouter();
  const [msg, setMsg] = useState("");
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setMsg(ok); r.refresh(); } catch (e: any) { setMsg(e.message); } };
  if (dnc) return <p className="text-sm text-rose-300">On the do-not-contact list.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stage === "new" && <button className="btn-primary btn-sm" onClick={() => act(() => api(`/api/admin/leads/${id}`, { stage: "contacted" }, "PATCH"), "Moved to Contacted ✓")}>Mark contacted</button>}
      <a href="/admin/crm" className="btn-ghost btn-sm">Open pipeline</a>
      <button className="btn-ghost btn-sm text-rose-300" onClick={() => confirm("Add this business to the do-not-contact list?") && act(() => api(`/api/admin/leads/${id}/dnc`, {}), "Added to do-not-contact ✓")}>Do not contact</button>
      {msg && <span className="text-xs text-accent-2">{msg}</span>}
    </div>
  );
}
