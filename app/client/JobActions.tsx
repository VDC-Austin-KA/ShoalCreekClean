"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-fetch";
import { FREQ_LABEL } from "@/lib/format";

export function JobActions({ id, frequency, rebookOnly }: { id: string; frequency: string; rebookOnly?: boolean }) {
  const r = useRouter();
  const [msg, setMsg] = useState("");
  const run = async (fn: () => Promise<any>, ok: string) => { try { await fn(); setMsg(ok); r.refresh(); } catch (e: any) { setMsg(e.message); } };
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button className="btn-ghost btn-sm" onClick={() => run(() => api(`/api/client/jobs/${id}/rebook`, {}), "Re-booked ✓ — we'll confirm your crew.")}>↻ Book again</button>
      {!rebookOnly && (
        <select aria-label="Frequency" className="input w-auto py-1.5 text-xs" defaultValue={frequency}
          onChange={(e) => run(() => api(`/api/client/jobs/${id}`, { frequency: e.target.value }, "PATCH"), "Frequency updated ✓")}>
          {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}
      {msg && <span className="text-xs text-accent-2">{msg}</span>}
    </div>
  );
}
