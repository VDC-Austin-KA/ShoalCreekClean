import { STATUS_FLOW, STATUS_LABEL } from "@/lib/format";
import { cx } from "./ui";

export function StatusTracker({ status }: { status: string }) {
  const idx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  return (
    <ol className="flex items-center gap-1.5">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <div className={cx("h-1 rounded-full transition-colors duration-150", i <= idx ? "bg-accent" : "bg-ink-700")} />
          <span className={cx("text-[11px]", i === idx ? "font-medium text-slate-200" : "text-slate-500")}>{STATUS_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}
