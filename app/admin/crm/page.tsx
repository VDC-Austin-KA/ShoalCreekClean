import { q } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { Pipeline } from "./Pipeline";

export const dynamic = "force-dynamic";
export default async function CRM() {
  const leads = await q("SELECT id,name,company,email,segment,city,stage,value_cents,source,notes,to_char(updated_at,'Mon DD') AS updated FROM leads ORDER BY updated_at DESC");
  return (
    <div>
      <PageHeader title="Lead pipeline" sub="New → Contacted → Quoted → Won → Retained. Drag cards to advance." />
      <Pipeline leads={leads} />
    </div>
  );
}
