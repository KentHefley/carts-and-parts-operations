import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  outputFileTracingIncludes: { "/reports/export": ["./public/branding/logo.png"] },
  webpack(config, { dev }) {
    // Cached production builds hit a WasmHash failure in this environment.
    // Keep builds reproducible without clearing the running dev server's output.
    if (!dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
