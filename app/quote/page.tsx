import { Logo } from "@/components/ui";
import { QuoteWizard } from "./QuoteWizard";

export const metadata = { title: "Instant quote" };
export default async function QuotePage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Logo />
      <h1 className="headline mt-10 text-3xl sm:text-4xl animate-rise">Instant quote</h1>
      <p className="mt-2 mb-8 text-slate-400">Four quick steps. Prices update live as you go.</p>
      <QuoteWizard initialType={type} />
    </div>
  );
}
