import { q } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { Pipeline } from "./Pipeline";

export const dynamic = "force-dynamic";
export default async function CRM() {
  const leads = (await q("SELECT id,name,company,email,segment,city,stage,value_cents,source,notes,updated_at FROM leads ORDER BY updated_at DESC"))
    .map((l) => ({ ...l, updated: new Date(l.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }) }));
  return (
    <div>
      <PageHeader title="Lead pipeline" sub="New → Contacted → Quoted → Won → Retained. Drag cards to advance." />
      <Pipeline leads={leads} />
    </div>
  );
}
