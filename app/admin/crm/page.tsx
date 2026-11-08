import { q } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { Pipeline } from "./Pipeline";

export const dynamic = "force-dynamic";
export default async function CRM() {
  // Researched (lead finder) leads join the pipeline once a partner works them.
  const leads = (await q(`SELECT id,name,company,email,segment,city,stage,value_cents,source,notes,updated_at FROM leads
     WHERE NOT (stage = 'new' AND id IN (SELECT lead_id FROM lead_intel))
     ORDER BY updated_at DESC`))
    .map((l) => ({ ...l, updated: new Date(l.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) }));
  return (
    <div>
      <PageHeader title="Lead pipeline" sub="New → Contacted → Quoted → Won → Retained. Drag cards to advance. Researched leads appear here once you work them from the Lead finder." />
      <Pipeline leads={leads} />
    </div>
  );
}
