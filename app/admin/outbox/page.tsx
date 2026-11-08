import { q } from "@/lib/db";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { dt } from "@/lib/format";

export const dynamic = "force-dynamic";
export default async function Outbox() {
  const mail = await q("SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 200");
  return (
    <div>
      <PageHeader title="Email outbox" sub={process.env.SMTP_URL ? "SMTP delivery enabled" : "Simulated delivery — set SMTP_URL to send real email"} />
      <Card>
        {mail.length ? (
          <ul className="divide-y divide-ink-700">
            {mail.map((m) => (
              <li key={m.id}>
                <details className="group py-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="min-w-0"><span className="text-slate-200">{m.subject}</span><span className="block text-xs text-slate-500">to {m.to_email} · {m.kind}</span></span>
                    <span className="flex items-center gap-2 text-xs text-slate-500"><Badge status={m.status} />{dt(m.created_at)}</span>
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-ink-900 p-4 font-sans text-sm text-slate-400">{m.body}</pre>
                </details>
              </li>
            ))}
          </ul>
        ) : <Empty>No emails yet.</Empty>}
      </Card>
    </div>
  );
}
