import { q } from "@/lib/db";
import { Badge, Card, PageHeader } from "@/components/ui";
import { dt } from "@/lib/format";
import { Composer, SendButton } from "./Composer";

export const dynamic = "force-dynamic";
export default async function Campaigns({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const list = await q("SELECT * FROM campaigns ORDER BY created_at DESC");
  return (
    <div className="space-y-6">
      <PageHeader title="Email campaigns" sub="Seasonal specials and targeted outreach. Merge tags: {{first_name}} {{company}} {{city}} {{quote_url}}" />
      <Composer initial={{ name: sp.name ?? "", subject: sp.subject ?? "", body: sp.body ?? "", audience: sp.audience ?? "commercial" }} />
      <Card title="Campaigns">
        <ul className="divide-y divide-white/5">
          {list.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div><div className="font-medium text-slate-200">{c.name}</div><div className="text-xs text-slate-500">{c.subject} · audience: {c.audience}</div></div>
              <div className="flex items-center gap-3">
                <Badge status={c.status} />
                {c.status === "sent" ? <span className="text-xs text-slate-500">{c.recipient_count} recipients · {dt(c.sent_at)}</span> : <SendButton id={c.id} />}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
