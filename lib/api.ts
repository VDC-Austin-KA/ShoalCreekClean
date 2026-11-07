import "server-only";
import { NextResponse } from "next/server";
import { HttpError } from "./auth";

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<unknown>;
/** Wraps a route handler: JSON response + uniform error handling. */
export const route = (fn: Handler) => async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
  try {
    const out = await fn(req, ctx);
    return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};
export const bad = (msg: string) => new HttpError(400, msg);
export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
