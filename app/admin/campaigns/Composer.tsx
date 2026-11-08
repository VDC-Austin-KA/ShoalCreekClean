"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { merge } from "@/lib/merge";
import { SEGMENTS, SEGMENT_LABEL } from "@/lib/format";
import { Card } from "@/components/ui";

export function Composer({ initial }: { initial: { name: string; subject: string; body: string; audience: string } }) {
  const r = useRouter();
  const [f, setF] = useState(initial);
  const [count, setCount] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { api(`/api/admin/campaigns?audience=${f.audience}`).then((d) => setCount(d.count)).catch(() => setCount(null)); }, [f.audience]);
  const sample = { first_name: "Jordan", company: "Sample Property Group", city: "Austin", quote_url: "/quote" };
  return (
    <Card title="Compose">
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); try { await api("/api/admin/campaigns", f); setMsg("Draft saved ✓"); setF({ name: "", subject: "", body: "", audience: f.audience }); r.refresh(); } catch (x: any) { setMsg(x.message); } }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Campaign name</label><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><label className="label">Audience {count !== null && <span className="normal-case text-accent">· {count} contacts</span>}</label>
              <select className="input" value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value })}>
                <option value="all">Everyone</option><option value="commercial">All commercial</option><option value="residential">Residential</option>
                {SEGMENTS.filter((s) => s !== "residential").map((s) => <option key={s} value={s}>{SEGMENT_LABEL[s]}</option>)}
              </select></div>
          </div>
          <div><label className="label">Subject</label><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></div>
          <div><label className="label">Body</label><textarea className="input min-h-48 font-mono text-xs" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
          <div className="flex items-center gap-3"><button className="btn-primary">Save draft</button>{msg && <span className="text-xs text-accent-2">{msg}</span>}</div>
        </form>
        <div>
          <div className="label">Preview</div>
          <div className="rounded-xl border border-ink-700 bg-white p-5 text-sm text-slate-800 shadow-inner">
            <div className="border-b pb-2 text-xs text-slate-500">To: jordan@example.com</div>
            <div className="mt-2 font-semibold">{merge(f.subject, sample) || "Subject"}</div>
            <div className="mt-3 whitespace-pre-wrap">{merge(f.body, sample) || "Body…"}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SendButton({ id }: { id: string }) {
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className="btn-primary btn-sm" disabled={busy} onClick={async () => { if (!confirm("Send this campaign now?")) return; setBusy(true); try { const d = await api(`/api/admin/campaigns/${id}/send`, {}); alert(`Dispatched to ${d.sent} recipients (see Outbox).`); r.refresh(); } catch (e: any) { alert(e.message); } finally { setBusy(false); } }}>{busy ? "Sending…" : "Send now"}</button>;
}
