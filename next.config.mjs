/** @type {import('next').NextConfig} */
export default {
  output: "standalone",
  serverExternalPackages: ["pg", "bcryptjs"],
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
};
