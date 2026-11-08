import Link from "next/link";
import { q } from "@/lib/db";
import { clientForPage } from "@/lib/clientctx";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { dt, usd } from "@/lib/format";
import { stripeEnabled } from "@/lib/stripe";
import { PayButton, Methods } from "./Billing";

export const dynamic = "force-dynamic";
export default async function BillingPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const { c } = await clientForPage();
  if (!c) return <Empty>No client profile.</Empty>;
  const [invoices, methods] = await Promise.all([
    q("SELECT * FROM invoices WHERE client_id=$1 ORDER BY created_at DESC", [c.id]),
    q("SELECT id,kind,label,is_default FROM payment_methods WHERE client_id=$1 ORDER BY is_default DESC, created_at", [c.id]),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Billing" sub={stripeEnabled() ? "Secure payments by Stripe (card or ACH)" : "Alpha mode — payments are simulated"} />
      {(await searchParams).paid && <div className="glass border-lime-400/30 p-4 text-sm text-lime-300">Payment received — thank you!</div>}
      <Card title="Invoices">
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-medium text-slate-500"><tr><th className="py-2">#</th><th>Description</th><th>Due</th><th className="text-right">Amount</th><th className="pl-4">Status</th><th /></tr></thead>
              <tbody className="divide-y divide-ink-700">
                {invoices.map((i) => (
                  <tr key={i.id} className="transition-colors hover:bg-ink-850">
                    <td className="py-3 text-slate-400">{i.number}</td>
                    <td className="max-w-64 truncate">{i.description}</td>
                    <td className="text-slate-400">{dt(i.due_date, { month: "short", day: "numeric", timeZone: "UTC" })}</td>
                    <td className="text-right tabular-nums">{usd(i.amount_cents)}</td>
                    <td className="pl-4"><Badge status={i.status} /></td>
                    <td className="text-right">
                      {i.status === "open" ? <PayButton id={i.id} stripe={stripeEnabled()} methods={methods} />
                        : <Link href={`/client/receipt/${i.id}`} className="btn-ghost btn-sm">Receipt ↓</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>No invoices yet.</Empty>}
      </Card>
      <Card title="Saved payment methods"><Methods methods={methods} /></Card>
    </div>
  );
}
