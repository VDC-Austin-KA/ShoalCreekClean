import Link from "next/link";
import type { ReactNode } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cx("glass p-5", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-slate-200">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

// Status → neutral-tinted badge. Colors come from the remapped palette tokens in globals.css.
const TONE = {
  neutral: "border-ink-600 text-slate-400 bg-transparent",
  accent: "border-accent/35 text-accent bg-accent/[0.06]",
  success: "border-lime-400/35 text-lime-300 bg-lime-400/[0.06]",
  warning: "border-amber-400/35 text-amber-300 bg-amber-400/[0.06]",
  error: "border-rose-400/35 text-rose-300 bg-rose-400/[0.06]",
  review: "border-violet-400/35 text-violet-300 bg-violet-400/[0.06]",
};
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  scheduled: "neutral", en_route: "warning", in_progress: "accent", completed: "success", cancelled: "error",
  open: "warning", paid: "success", review: "review", estimated: "accent", simulated: "neutral", sent: "success", draft: "neutral", failed: "error",
};
export function Badge({ status, children }: { status: string; children?: ReactNode }) {
  // Capitalized via CSS only, so the underlying text (used by features and tests) is unchanged.
  return <span className={cx("chip capitalize", TONE[STATUS_TONE[status] ?? "neutral"])}>{children ?? status.replace("_", " ")}</span>;
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="glass px-5 py-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-100 tabular-nums">{value}</div>
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
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-80" />
    </div>
  );
}

/** Brand mark: a single creek-stone drop on the accent, wordmark in primary text. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-100">
      <span className="grid size-7 place-items-center rounded-md bg-accent text-ink-950">
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden><path d="M12 2.5s6.5 7 6.5 11.6a6.5 6.5 0 0 1-13 0C5.5 9.5 12 2.5 12 2.5Z" /></svg>
      </span>
      <span>Shoal Creek <span className="font-normal text-slate-400">Clean</span></span>
    </Link>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="headline text-xl sm:text-2xl">{title}</h1>
        {sub && <p className="mt-1 max-w-3xl text-sm text-slate-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="rounded-lg border border-dashed border-ink-700 p-6 text-center text-sm text-slate-500">{children}</div>;
