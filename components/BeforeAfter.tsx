"use client";
import { useRef, useState } from "react";

/** Draggable before/after comparison. Default art is a CSS-rendered paver surface. */
export function BeforeAfter({ before, after, label }: { before?: string; after?: string; label?: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const move = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
  };
  const surface = "repeating-linear-gradient(0deg, transparent 0 58px, rgb(0 0 0/.35) 58px 61px), repeating-linear-gradient(90deg, transparent 0 118px, rgb(0 0 0/.35) 118px 121px)";
  const bg = (img: string | undefined, dirty: boolean) =>
    img
      ? { backgroundImage: `url("${img}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : {
          backgroundImage: dirty
            ? `radial-gradient(circle at 20% 30%, rgb(30 25 15/.75), transparent 22%), radial-gradient(circle at 70% 60%, rgb(25 30 15/.7), transparent 28%), radial-gradient(circle at 45% 85%, rgb(10 10 5/.6), transparent 18%), ${surface}, linear-gradient(135deg,#6b6250,#4a4436)`
            : `${surface}, linear-gradient(135deg,#d6d3cb,#b4b0a5)`,
        };
  return (
    <div ref={ref} role="slider" aria-label={label ?? "Before and after comparison"} aria-valuenow={Math.round(pos)} tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5)); if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5)); }}
      onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX); }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
      className="relative aspect-[16/10] w-full cursor-ew-resize touch-none select-none overflow-hidden rounded-2xl border border-white/10">
      <div className="absolute inset-0" style={bg(after, false)} />
      <div className="absolute inset-0" style={{ ...bg(before, true), clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <span className="chip absolute left-3 top-3 border-white/20 bg-black/50 text-white">Before</span>
      <span className="chip absolute right-3 top-3 border-white/20 bg-black/50 text-white">After</span>
      <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_20px_rgb(34_211_238)]" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-ink-900/80 text-white backdrop-blur">⇆</div>
      </div>
      {label && <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur">{label}</div>}
    </div>
  );
}
