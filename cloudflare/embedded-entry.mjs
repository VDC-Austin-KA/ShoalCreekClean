// Worker entry for `npm run cf:deploy:embedded`: serves Next's static files from the bundle (assets-first,
// like Workers Static Assets would), then hands every other request to the unmodified OpenNext worker.
import openNext from "../.open-next/worker.js";
import { ASSETS } from "../.open-next/embedded-assets.mjs";

const decoded = new Map();
const body = (path, [, enc, data]) => {
  if (enc === "text") return data;
  if (!decoded.has(path)) decoded.set(path, Uint8Array.from(atob(data), (c) => c.charCodeAt(0)));
  return decoded.get(path);
};

export default {
  async fetch(request, env, ctx) {
    let { pathname } = new URL(request.url);
    try { pathname = decodeURIComponent(pathname); } catch { /* malformed escape: use as-is */ } // e.g. /app/[id]/ chunks arrive as %5Bid%5D
    const asset = (request.method === "GET" || request.method === "HEAD") && ASSETS[pathname];
    if (asset)
      return new Response(request.method === "HEAD" ? null : body(pathname, asset), {
        headers: {
          "content-type": asset[0],
          "cache-control": pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
        },
      });
    return openNext.fetch(request, env, ctx);
  },
};
