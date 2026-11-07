"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client-fetch";
import { Badge, cx } from "@/components/ui";

const ACTION: Record<string, [string, string]> = { scheduled: ["en_route", "🚚 Start driving"], en_route: ["in_progress", "⏱ Arrived — clock in"], in_progress: ["completed", "✓ Complete & clock out"] };

async function resize(file: File, max = 1280): Promise<string> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.75);
}

export function FieldJob({ job, n }: { job: any; n: number }) {
  const r = useRouter();
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const photos: { id: string; kind: string; url: string }[] = job.photos ?? [];
  const next = ACTION[job.status];
  async function advance() {
    setBusy("status"); setErr("");
    try { await api(`/api/field/jobs/${job.id}/status`, { status: next[0] }); r.refresh(); } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function upload(kind: string, files: FileList | null) {
    if (!files?.length) return;
    setBusy(kind); setErr("");
    try { for (const f of Array.from(files)) await api(`/api/field/jobs/${job.id}/photos`, { kind, dataUrl: await resize(f) }); r.refresh(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  return (
    <div className={cx("glass p-4 animate-rise", job.status === "completed" && "opacity-60")} style={{ animationDelay: `${n * 50}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-sm font-semibold text-accent">{n}</span>
          <div><div className="font-semibold text-white">{job.title}</div><div className="text-xs text-slate-500">{job.time} · {job.client}</div></div>
        </div>
        <Badge status={job.status} />
      </div>
      <div className="mt-3 text-sm text-slate-300">{job.address}</div>
      <div className="mt-1 text-xs text-slate-500">{Math.round(job.quoted_minutes / 6) / 10}h quoted · {job.crew_size} techs{job.equipment?.length ? ` · ${job.equipment.join(", ")}` : ""}</div>
      {job.status === "in_progress" && job.clock_in && <div className="mt-1 text-xs text-accent">Clocked in {new Date(job.clock_in).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}</div>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a className="btn-ghost py-3" target="_blank" href={`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}&travelmode=driving`}>🧭 Navigate</a>
        {job.phone ? <a className="btn-ghost py-3" href={`tel:${job.phone}`}>📞 Call site</a> : <span />}
      </div>
      {job.status !== "scheduled" && job.status !== "completed" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["before", "after"] as const).map((k) => (
            <label key={k} className="btn-ghost cursor-pointer py-3 capitalize">
              {busy === k ? "Uploading…" : `📷 ${k} (${photos.filter((p) => p.kind === k).length})`}
              <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => upload(k, e.target.files)} />
            </label>
          ))}
        </div>
      )}
      {photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photos.map((p) => <div key={p.id} className="relative shrink-0"><img src={p.url} alt={p.kind} className="h-16 w-24 rounded-lg object-cover" /><span className="chip absolute bottom-0.5 left-0.5 border-0 bg-black/60 px-1.5 text-[9px] text-white">{p.kind}</span></div>)}
        </div>
      )}
      {next && <button className="btn-primary mt-3 w-full py-3.5 text-base" disabled={!!busy} onClick={advance}>{busy === "status" ? "…" : next[1]}</button>}
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
    </div>
  );
}
