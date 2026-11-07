"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-fetch";

export function ApplyPlan({ day, count }: { day: string; count: number }) {
  const r = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div>
      <button className="btn-primary w-full" onClick={async () => { const res = await api("/api/admin/planner", { day }); setMsg(`Assigned ${res.assigned}, ${res.unplaced} unplaced. Routes optimized.`); r.refresh(); }}>
        Apply plan{count ? ` (${count})` : " & optimize routes"}
      </button>
      {msg && <p className="mt-2 text-xs text-accent-2">{msg}</p>}
    </div>
  );
}
