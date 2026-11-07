"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-fetch";

export function ApproveQuote({ id, total }: { id: string; total: number }) {
  const r = useRouter();
  const [v, setV] = useState(total);
  return (
    <div className="mt-2 flex gap-2">
      <input type="number" className="input py-1.5 text-xs" value={v} onChange={(e) => setV(+e.target.value)} aria-label="Approved total" />
      <button className="btn-primary btn-sm" onClick={async () => { await api(`/api/admin/quotes/${id}/approve`, { total: v }); r.refresh(); }}>Approve & send</button>
    </div>
  );
}
