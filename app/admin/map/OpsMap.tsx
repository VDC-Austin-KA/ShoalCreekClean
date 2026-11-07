"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-fetch";
import { optimizeRoute, routeSummary, type LatLng } from "@/lib/geo";
import { usd } from "@/lib/format";
import { cx } from "@/components/ui";

type Data = {
  zones: { id: string; name: string; color: string; phase: number; polygon: number[][]; notes: string | null }[];
  markers: { id: string; layer: "competitor" | "hotspot" | "pricing"; label: string; lat: number; lng: number; radius_m: number; value: number; notes: string | null }[];
  jobs: { id: string; title: string; lat: number; lng: number; status: string; day: string | null; client: string }[];
  leads: { id: string; name: string; company: string | null; stage: string; lat: number; lng: number; value_cents: number }[];
  crews: { id: string; name: string; color: string; home_lat: number; home_lng: number }[];
};
const LAYERS = { zones: "Service zones", competitor: "Competitors", hotspot: "Commercial density", pricing: "Pricing heat", jobs: "Open jobs", leads: "Leads" } as const;
type LayerKey = keyof typeof LAYERS;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const dot = (color: string, size = 12) => L.divIcon({ className: "", iconSize: [size, size], html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${color}33,0 0 12px ${color}"></div>` });

export default function OpsMap({ data }: { data: Data }) {
  const router = useRouter();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const groups = useRef<Record<string, L.LayerGroup>>({});
  const draft = useRef<L.Polyline | null>(null);
  const routeLine = useRef<L.Polyline | null>(null);
  const [on, setOn] = useState<Record<LayerKey, boolean>>({ zones: true, competitor: true, hotspot: true, pricing: false, jobs: true, leads: false });
  const [mode, setMode] = useState<"view" | "draw" | "route">("view");
  const [pts, setPts] = useState<[number, number][]>([]);
  const [zoneForm, setZoneForm] = useState({ name: "", color: "#22d3ee", phase: 1 });
  const [stops, setStops] = useState<string[]>([]);
  const [crewId, setCrewId] = useState(data.crews[0]?.id ?? "");
  const [route, setRoute] = useState<{ minutes: number; km: number; legs: { km: number; min: number }[]; order: string[]; source: string } | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Init map once
  useEffect(() => {
    const m = L.map(el.current!, { zoomControl: true, attributionControl: true }).setView([30.38, -97.74], 10);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19 }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => { if (modeRef.current === "draw") setPts((p) => [...p, [+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)]]); });
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // (Re)build layers
  useEffect(() => {
    const m = map.current!;
    Object.values(groups.current).forEach((g) => g.remove());
    const g: Record<string, L.LayerGroup> = Object.fromEntries(Object.keys(LAYERS).map((k) => [k, L.layerGroup()]));
    for (const z of data.zones)
      L.polygon(z.polygon as L.LatLngTuple[], { interactive: mode !== "draw", color: z.color, weight: 1.5, fillOpacity: z.phase > 1 ? 0.04 : 0.1, dashArray: z.phase > 1 ? "6 6" : undefined })
        .bindPopup(`<b>${esc(z.name)}</b><br/>Phase ${z.phase}<br/><small>${esc(z.notes ?? "")}</small><br/><button data-del-zone="${z.id}" style="margin-top:6px;color:#fb7185">Delete zone</button>`)
        .addTo(g.zones);
    for (const mk of data.markers) {
      const color = mk.layer === "competitor" ? "#fb7185" : mk.layer === "hotspot" ? "#fbbf24" : "#a78bfa";
      const opacity = mk.layer === "hotspot" ? 0.12 + mk.value * 0.25 : mk.layer === "pricing" ? 0.08 + (mk.value - 0.15) * 3 : 0.15;
      L.circle([mk.lat, mk.lng], { interactive: mode !== "draw", radius: mk.radius_m, color, weight: mk.layer === "competitor" ? 1 : 0, fillColor: color, fillOpacity: opacity })
        .bindPopup(`<b>${esc(mk.label)}</b><br/><small>${esc(mk.notes ?? "")}${mk.layer === "competitor" ? `<br/><a href=\"/admin/competitors\" style=\"color:#22d3ee\">Competitor profile →</a>` : ""}</small>`)
        .addTo(g[mk.layer]);
    }
    for (const j of data.jobs) {
      const sel = stops.includes(j.id);
      L.marker([j.lat, j.lng], { icon: dot(sel ? "#a3e635" : "#22d3ee", sel ? 16 : 12) })
        .bindTooltip(`${esc(j.title)} · ${esc(j.client)}${j.day ? ` · ${j.day}` : ""}`)
        .on("click", () => { if (modeRef.current === "route") setStops((s) => (s.includes(j.id) ? s.filter((x) => x !== j.id) : [...s, j.id])); })
        .addTo(g.jobs);
    }
    for (const c of data.crews) L.marker([c.home_lat, c.home_lng], { icon: dot(c.color, 14) }).bindTooltip(`${esc(c.name)} home base`).addTo(g.jobs);
    for (const l of data.leads) L.marker([l.lat, l.lng], { icon: dot("#f472b6", 10) }).bindTooltip(`${esc(l.company ?? l.name)} · ${l.stage} · ${usd(l.value_cents)}`).addTo(g.leads);
    (Object.keys(LAYERS) as LayerKey[]).forEach((k) => on[k] && g[k].addTo(m));
    groups.current = g;
  }, [data, on, stops, mode]);

  // Delete-zone buttons inside popups
  useEffect(() => {
    const m = map.current!;
    const h = (e: L.PopupEvent) => {
      const btn = e.popup.getElement()?.querySelector<HTMLButtonElement>("[data-del-zone]");
      if (btn) btn.onclick = async () => { if (confirm("Delete this zone?")) { await api("/api/admin/zones", { id: btn.dataset.delZone }, "DELETE"); router.refresh(); } };
    };
    m.on("popupopen", h);
    return () => { m.off("popupopen", h); };
  }, [router]);

  // Draft polygon preview
  useEffect(() => {
    draft.current?.remove();
    if (pts.length) draft.current = L.polyline([...pts, pts[0]] as L.LatLngTuple[], { color: zoneForm.color, dashArray: "4 4" }).addTo(map.current!);
  }, [pts, zoneForm.color]);

  async function saveZone() {
    await api("/api/admin/zones", { ...zoneForm, polygon: pts });
    setPts([]); setMode("view"); router.refresh();
  }

  async function optimize(useRoads: boolean) {
    const crew = data.crews.find((c) => c.id === crewId)!;
    const home: LatLng = { lat: crew.home_lat, lng: crew.home_lng };
    const js = stops.map((id) => data.jobs.find((j) => j.id === id)!);
    const order = optimizeRoute(home, js).map((i) => js[i]);
    let res = { ...routeSummary(home, order), order: order.map((j) => j.title), source: "Estimate (straight-line × 1.35 @ 48 km/h)" };
    let line: L.LatLngTuple[] = [[home.lat, home.lng], ...order.map((j) => [j.lat, j.lng] as L.LatLngTuple)];
    if (useRoads) {
      try {
        const coords = line.map(([a, b]) => `${b},${a}`).join(";");
        const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`).then((x) => x.json());
        const rt = r.routes[0];
        res = { ...res, minutes: Math.round(rt.duration / 60), km: +(rt.distance / 1000).toFixed(1), legs: rt.legs.map((l: any) => ({ km: +(l.distance / 1000).toFixed(1), min: Math.round(l.duration / 60) })), source: "Road network (OSRM demo server)" };
        line = rt.geometry.coordinates.map(([a, b]: number[]) => [b, a]);
      } catch { res.source += " — road service unavailable"; }
    }
    routeLine.current?.remove();
    routeLine.current = L.polyline(line, { color: "#a3e635", weight: 3 }).addTo(map.current!);
    map.current!.fitBounds(routeLine.current.getBounds(), { padding: [40, 40] });
    setRoute(res);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="glass relative overflow-hidden p-0">
        <div className={cx("h-[72vh] w-full", mode === "draw" && "[&_.leaflet-container]:cursor-crosshair")}><div ref={el} className="h-full w-full" /></div>
        <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex flex-wrap gap-3 rounded-xl bg-ink-950/80 px-3 py-2 text-[11px] text-slate-400 backdrop-blur">
          <span><i className="mr-1 inline-block size-2 rounded-full bg-rose-400" />Competitor</span><span><i className="mr-1 inline-block size-2 rounded-full bg-amber-400" />Density</span>
          <span><i className="mr-1 inline-block size-2 rounded-full bg-violet-400" />Price heat</span><span><i className="mr-1 inline-block size-2 rounded-full bg-cyan-400" />Job</span><span><i className="mr-1 inline-block size-2 rounded-full bg-pink-400" />Lead</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="glass p-4">
          <div className="label">Layers</div>
          {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
            <label key={k} className="flex items-center gap-2 py-1 text-sm text-slate-300"><input type="checkbox" className="accent-cyan-400" checked={on[k]} onChange={(e) => setOn({ ...on, [k]: e.target.checked })} />{LAYERS[k]}</label>
          ))}
          <p className="mt-2 text-[11px] text-slate-600">Competitor + pricing layers come from sourced public research (city-level placement). See Competitor intel.</p>
        </div>
        <div className="glass p-4">
          <div className="mb-3 grid grid-cols-3 rounded-xl bg-ink-900 p-1 text-xs">
            {(["view", "draw", "route"] as const).map((m) => <button key={m} onClick={() => { setMode(m); setPts([]); }} className={cx("rounded-lg py-1.5 capitalize", mode === m ? "bg-white/10 text-white" : "text-slate-500")}>{m === "draw" ? "Draw zone" : m}</button>)}
          </div>
          {mode === "draw" && (
            <div className="space-y-2 animate-rise">
              <p className="text-xs text-slate-400">Click the map to add vertices ({pts.length} placed).</p>
              <input className="input" placeholder="Zone name" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
              <div className="flex gap-2">
                <input type="color" className="h-10 w-14 rounded-lg bg-transparent" value={zoneForm.color} onChange={(e) => setZoneForm({ ...zoneForm, color: e.target.value })} />
                <select className="input" value={zoneForm.phase} onChange={(e) => setZoneForm({ ...zoneForm, phase: +e.target.value })}><option value={1}>Phase 1</option><option value={2}>Phase 2</option></select>
              </div>
              <div className="flex gap-2"><button className="btn-primary btn-sm" disabled={pts.length < 3 || !zoneForm.name} onClick={saveZone}>Save zone</button><button className="btn-ghost btn-sm" onClick={() => setPts(pts.slice(0, -1))}>Undo point</button></div>
            </div>
          )}
          {mode === "route" && (
            <div className="space-y-2 animate-rise">
              <p className="text-xs text-slate-400">Click job pins to add stops ({stops.length} selected).</p>
              <select className="input" value={crewId} onChange={(e) => setCrewId(e.target.value)}>{data.crews.map((c) => <option key={c.id} value={c.id}>Start: {c.name} base</option>)}</select>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary btn-sm" disabled={!stops.length} onClick={() => optimize(false)}>Optimize</button>
                <button className="btn-ghost btn-sm" disabled={!stops.length} onClick={() => optimize(true)}>Road times</button>
                <button className="btn-ghost btn-sm" onClick={() => { setStops([]); setRoute(null); routeLine.current?.remove(); }}>Clear</button>
              </div>
              {route && (
                <div className="mt-2 rounded-xl border border-lime-400/20 bg-lime-400/5 p-3 text-sm">
                  <div className="text-lg font-semibold text-lime-200">{route.minutes} min · {route.km} km</div>
                  <ol className="mt-2 space-y-1 text-xs text-slate-300">{route.order.map((t, i) => <li key={i}>{i + 1}. {t} <span className="text-slate-500">({route.legs[i]?.min} min)</span></li>)}</ol>
                  <div className="mt-2 text-[10px] text-slate-500">{route.source}</div>
                </div>
              )}
            </div>
          )}
          {mode === "view" && <p className="text-xs text-slate-500">Click shapes for details. Switch to Draw or Route mode to edit.</p>}
        </div>
      </div>
    </div>
  );
}
