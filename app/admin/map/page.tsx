import { q } from "@/lib/db";
import { dt } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { MapLoader } from "./MapLoader";

export const dynamic = "force-dynamic";
export default async function MapPage() {
  const [zones, markers, jobs, leads, crews] = await Promise.all([
    q("SELECT id,name,color,phase,polygon,notes FROM service_zones ORDER BY phase"),
    q("SELECT id,layer,label,lat,lng,radius_m,value,notes FROM map_markers"),
    q(`SELECT j.id,j.title,j.lat,j.lng,j.status,j.scheduled_start, COALESCE(c.company,c.contact_name) AS client
       FROM jobs j JOIN clients c ON c.id=j.client_id WHERE j.status <> 'completed' AND j.status <> 'cancelled'`).then((rows) =>
      rows.map(({ scheduled_start, ...j }) => ({ ...j, day: scheduled_start ? dt(scheduled_start, { weekday: "short", month: "short", day: "numeric" }) : null }))),
    q("SELECT id,name,company,stage,lat,lng,value_cents FROM leads WHERE lat IS NOT NULL"),
    q("SELECT id,name,color,home_lat,home_lng FROM crews"),
  ]);
  return (
    <div>
      <PageHeader title="Coverage & market map" sub="Service zones, competitor clusters, commercial density and pricing. Draw zones and plan routes." />
      <MapLoader data={{ zones, markers, jobs, leads, crews }} />
    </div>
  );
}
