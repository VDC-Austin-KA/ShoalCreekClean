/** @type {import('next').NextConfig} */
export default {
  output: "standalone",
  serverExternalPackages: ["pg", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  webpack(config) {
    // db/schema.sql is bundled as a string so the Worker can apply it (see app/api/admin/setup).
    config.module.rules.push({ test: /\.sql$/, type: "asset/source" });
    return config;
  },
};
