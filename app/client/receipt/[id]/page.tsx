import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { clientForPage } from "@/lib/clientctx";
import { dt, usd } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { c } = await clientForPage();
  const inv = c && (await one("SELECT * FROM invoices WHERE id=$1 AND client_id=$2 AND status='paid'", [(await params).id, c.id]));
  if (!inv) notFound();
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-slate-900 shadow-2xl">
      <div className="flex items-start justify-between">
        <div><div className="text-xl font-bold">Shoal Creek Clean</div><div className="text-xs text-slate-500">Austin, Texas</div></div>
        <div className="text-right text-sm"><div className="font-semibold">RECEIPT</div><div>#{inv.number}</div></div>
      </div>
      <div className="mt-8 text-sm"><div className="text-slate-500">Billed to</div><div className="font-medium">{c.company ?? c.contact_name}</div><div>{c.address}</div></div>
      <table className="mt-8 w-full text-sm">
        <tbody>
          <tr className="border-b"><td className="py-2">{inv.description}</td><td className="text-right">{usd(inv.amount_cents)}</td></tr>
          <tr><td className="py-2 font-semibold">Total paid</td><td className="text-right font-semibold">{usd(inv.amount_cents)}</td></tr>
        </tbody>
      </table>
      <div className="mt-6 text-xs text-slate-500">Paid {dt(inv.paid_at)} via {inv.payment_method}. Retain for your tax records.</div>
      <PrintButton />
    </div>
  );
}
