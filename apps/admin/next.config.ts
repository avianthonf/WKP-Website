import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    reactCompiler: true,
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
};

export default nextConfig;
