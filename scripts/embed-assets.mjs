// Embeds .open-next/assets into a JS module so the Worker can be deployed WITHOUT Workers Static Assets
// (whose upload uses a short-lived JWT that some proxied CI/sandbox environments can't pass through).
// Output: .open-next/embedded-assets.mjs → export const ASSETS = { "/path": [contentType, "text"|"base64", data] }
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

const root = new URL("../.open-next/assets/", import.meta.url).pathname;
const TYPES = { ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg" };
const TEXT = new Set([".js", ".css", ".json", ".svg", ".txt"]);

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const entries = {};
let bytes = 0;
for (const file of walk(root)) {
  const path = "/" + relative(root, file).split("\\").join("/");
  const ext = extname(file);
  if (path === "/BUILD_ID" || path.endsWith(".gitkeep") || !TYPES[ext]) continue;
  const buf = readFileSync(file);
  bytes += buf.length;
  entries[path] = TEXT.has(ext) ? [TYPES[ext], "text", buf.toString("utf8")] : [TYPES[ext], "base64", buf.toString("base64")];
}
writeFileSync(new URL("../.open-next/embedded-assets.mjs", import.meta.url), `export const ASSETS = ${JSON.stringify(entries)};\n`);
console.log(`embedded ${Object.keys(entries).length} assets (${(bytes / 1024).toFixed(0)} KiB)`);
