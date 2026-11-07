import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` use the same Cloudflare bindings (local D1) as the deployed Worker.
initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
export default {
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};
