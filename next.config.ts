import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/reports/export": ["./public/branding/logo.png"] },
};

export default nextConfig;
