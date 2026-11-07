// Geo + planning helpers (pure; unit-tested in tests/).
export type LatLng = { lat: number; lng: number };

export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
/** Drive-time estimate: straight-line × 1.35 road factor at 48 km/h metro average. */
export const driveMinutes = (a: LatLng, b: LatLng) => Math.round(((haversineKm(a, b) * 1.35) / 48) * 60);

/** Nearest-neighbour ordering then 2-opt improvement. Returns indices into `stops`. */
export function optimizeRoute(start: LatLng, stops: LatLng[]): number[] {
  const left = stops.map((_, i) => i);
  const order: number[] = [];
  let cur = start;
  while (left.length) {
    let best = 0;
    for (let i = 1; i < left.length; i++) if (haversineKm(cur, stops[left[i]]) < haversineKm(cur, stops[left[best]])) best = i;
    const [n] = left.splice(best, 1);
    order.push(n);
    cur = stops[n];
  }
  const pts = (o: number[]) => [start, ...o.map((i) => stops[i])];
  const len = (o: number[]) => pts(o).reduce((s, p, i, a) => (i ? s + haversineKm(a[i - 1], p) : 0), 0);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < order.length - 1; i++)
      for (let k = i + 1; k < order.length; k++) {
        const cand = [...order.slice(0, i), ...order.slice(i, k + 1).reverse(), ...order.slice(k + 1)];
        if (len(cand) + 1e-9 < len(order)) { order.splice(0, order.length, ...cand); improved = true; }
      }
  }
  return order;
}

export function routeSummary(start: LatLng, stops: LatLng[]) {
  let km = 0, min = 0, cur = start;
  const legs = stops.map((s) => { const k = haversineKm(cur, s) * 1.35, m = driveMinutes(cur, s); km += k; min += m; cur = s; return { km: +k.toFixed(1), min: m }; });
  return { legs, km: +km.toFixed(1), minutes: min };
}

// ---------- Resource & labor allocation ----------
export type PlanJob = LatLng & { id: string; quoted_minutes: number; crew_size: number; equipment: string[]; service: string };
export type PlanCrew = { id: string; name: string; size: number; equipment: string[]; home_lat: number; home_lng: number; booked_minutes: number };
export type Assignment = { job_id: string; crew_id: string | null; reason: string; drive_min?: number };

const DAY_CAPACITY_MIN = 9 * 60; // shift length per crew

/**
 * Greedy allocation: longest jobs first; each goes to the feasible crew (enough people,
 * has required equipment, remaining capacity) with the lowest marginal cost =
 * drive time from the crew's last stop + load-balancing penalty.
 * `accuracy` (actual/quoted history, default 1) inflates quoted durations.
 */
export function allocate(jobs: PlanJob[], crews: PlanCrew[], accuracy = 1): Assignment[] {
  const state = crews.map((c) => ({ c, used: c.booked_minutes, at: { lat: c.home_lat, lng: c.home_lng } as LatLng }));
  const out: Assignment[] = [];
  for (const j of [...jobs].sort((a, b) => b.quoted_minutes - a.quoted_minutes)) {
    const need = Math.round(j.quoted_minutes * accuracy);
    let best: { s: (typeof state)[number]; cost: number; drive: number } | null = null;
    const why: string[] = [];
    for (const s of state) {
      if (s.c.size < j.crew_size) { why.push(`${s.c.name}: needs ${j.crew_size} techs`); continue; }
      const missing = j.equipment.filter((e) => !s.c.equipment.includes(e));
      if (missing.length) { why.push(`${s.c.name}: lacks ${missing.join(", ")}`); continue; }
      const drive = driveMinutes(s.at, j);
      if (s.used + need + drive > DAY_CAPACITY_MIN) { why.push(`${s.c.name}: at capacity`); continue; }
      const cost = drive + (s.used / DAY_CAPACITY_MIN) * 60;
      if (!best || cost < best.cost) best = { s, cost, drive };
    }
    if (best) {
      best.s.used += need + best.drive;
      best.s.at = j;
      out.push({ job_id: j.id, crew_id: best.s.c.id, drive_min: best.drive, reason: `${best.drive} min drive · ${Math.round((best.s.used / DAY_CAPACITY_MIN) * 100)}% utilized` });
    } else out.push({ job_id: j.id, crew_id: null, reason: why.join("; ") || "no crews" });
  }
  return out;
}

/** Ray-casting point-in-polygon; polygon is [[lat,lng],...]. */
export function inPolygon(p: LatLng, poly: number[][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i], [yj, xj] = poly[j];
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
