"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
/** Re-fetches server components on an interval (live job status). */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => document.visibilityState === "visible" && r.refresh(), seconds * 1000); return () => clearInterval(t); }, [r, seconds]);
  return null;
}
