import Link from "next/link";
import type { ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx("glass p-5 animate-rise", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "border-slate-500/40 text-slate-300 bg-slate-500/10",
  en_route: "border-amber-400/40 text-amber-300 bg-amber-400/10",
  in_progress: "border-accent/40 text-accent bg-accent/10",
  completed: "border-lime-400/40 text-lime-300 bg-lime-400/10",
  cancelled: "border-rose-400/40 text-rose-300 bg-rose-400/10",
  open: "border-amber-400/40 text-amber-300 bg-amber-400/10",
  paid: "border-lime-400/40 text-lime-300 bg-lime-400/10",
  review: "border-violet-400/40 text-violet-300 bg-violet-400/10",
  estimated: "border-accent/40 text-accent bg-accent/10",
  simulated: "border-slate-500/40 text-slate-300 bg-slate-500/10",
  sent: "border-lime-400/40 text-lime-300 bg-lime-400/10",
  draft: "border-slate-500/40 text-slate-300 bg-slate-500/10",
  failed: "border-rose-400/40 text-rose-300 bg-rose-400/10",
};
export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={cx("chip", STATUS_COLORS[status] ?? STATUS_COLORS.scheduled)}>{children ?? status.replace("_", " ")}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="glass lift p-5 animate-rise">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} />;
}
export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <Skeleton className="h-80" />
    </div>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5 font-semibold tracking-tight text-white">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-ink-950 transition-transform duration-500 ease-(--ease-spring) group-hover:rotate-12">
        <svg viewBox="0 0 24 24" className="size-4.5" fill="currentColor"><path d="M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2Z" /></svg>
      </span>
      Shoal Creek <span className="text-accent">Clean</span>
    </Link>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-rise">
      <div>
        <h1 className="headline text-2xl sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">{children}</div>;
