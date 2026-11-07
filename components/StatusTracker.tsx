import { STATUS_FLOW, STATUS_LABEL } from "@/lib/format";
import { cx } from "./ui";

export function StatusTracker({ status }: { status: string }) {
  const idx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  return (
    <ol className="flex items-center gap-1.5">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <div className={cx("h-1.5 rounded-full transition-all duration-700", i <= idx ? (i === idx && s !== "completed" ? "bg-accent animate-pulse" : "bg-accent") : "bg-white/10")} />
          <span className={cx("text-[10px] uppercase tracking-wide", i === idx ? "text-accent" : "text-slate-600")}>{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}
