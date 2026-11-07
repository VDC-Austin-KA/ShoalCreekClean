import { Logo } from "@/components/ui";
export const metadata = { title: "Our lead finder bot" };
export default function Bot() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Logo />
      <h1 className="headline mt-10 text-3xl">ShoalCreekCleanLeadFinder</h1>
      <div className="mt-6 space-y-4 text-slate-300">
        <p>If you saw <code className="text-accent">ShoalCreekCleanLeadFinder/1.0</code> in your logs: that&apos;s us, a small, locally owned exterior-cleaning company in Austin, TX.</p>
        <p>Every couple of weeks it visits the public <b>home, contact and about pages</b> of a handful of Central Texas businesses. It reads only what a business publishes for customers (business email, phone and team names) so we can introduce ourselves to the right person.</p>
        <ul className="list-disc space-y-1 pl-6 text-sm text-slate-400">
          <li>It obeys <code>robots.txt</code>. Add <code>User-agent: ShoalCreekCleanLeadFinder</code> / <code>Disallow: /</code> to opt out.</li>
          <li>It makes at most a few requests per site, and never logs in, fills in forms or gets past bot protection.</li>
          <li>It doesn&apos;t collect personal social profiles, home addresses or guessed email addresses.</li>
          <li>To be removed from our outreach entirely, email <a className="text-accent" href="mailto:hello@ackerworks.com">hello@ackerworks.com</a> or use the unsubscribe link in any email from us.</li>
        </ul>
      </div>
    </div>
  );
}
