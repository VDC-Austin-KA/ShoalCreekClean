import { q } from "@/lib/db";
import { validUnsub } from "@/lib/unsub";
import { Logo } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe", robots: { index: false } };
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = "", t = "" } = await searchParams;
  const email = e.toLowerCase().slice(0, 200);
  const ok = !!email && validUnsub(email, t);
  if (ok) await q("INSERT INTO suppressions (contact, reason) VALUES ($1, 'unsubscribe') ON CONFLICT (contact) DO NOTHING", [email]);
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="glass max-w-md p-8 text-center animate-rise">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="headline mt-6 text-2xl">{ok ? "You're unsubscribed" : "Link not valid"}</h1>
        <p className="mt-3 text-sm text-slate-400">{ok ? `${email} won't receive any more marketing email from Shoal Creek Clean. Sorry to bother you, and thanks for letting us know.` : "This unsubscribe link is incomplete. Reply to any of our emails with “unsubscribe” and we'll remove you right away."}</p>
      </div>
    </div>
  );
}
