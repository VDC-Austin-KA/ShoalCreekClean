import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { Logo, Badge } from "@/components/ui";
import { usd } from "@/lib/format";
import { BookQuote } from "./BookQuote";

export const dynamic = "force-dynamic";
export default async function QuoteView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qt = /^[0-9a-f-]{36}$/.test(id) ? await one("SELECT * FROM quotes WHERE id=$1", [id]) : null;
  if (!qt) notFound();
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Logo />
      <div className="glass mt-10 p-8 animate-rise">
        <div className="flex items-center justify-between"><h1 className="headline text-2xl">Your quote</h1><Badge status={qt.status} /></div>
        <ul className="mt-6 divide-y divide-white/5 text-sm">
          {qt.line_items.map((l: any, i: number) => <li key={i} className="flex justify-between py-2"><span className="text-slate-400">{l.label} <span className="text-xs text-slate-600">{l.quantity.toLocaleString()} {l.unit}</span></span><span>{usd(l.amount_cents)}</span></li>)}
        </ul>
        <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-semibold"><span>Total</span><span>{usd(qt.total_cents)}</span></div>
        {qt.status === "estimated" ? <BookQuote id={qt.id} /> : <p className="mt-6 text-sm text-slate-400">{qt.status === "review" ? "A partner is reviewing this request — we'll email you within 24 hours." : "This quote has been booked. Sign in to your client portal to track it."}</p>}
      </div>
    </div>
  );
}
