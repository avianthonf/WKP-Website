import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

function resolveSupabaseHostname() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return '**.supabase.co';
  }

  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return '**.supabase.co';
  }
}

const supabaseHostname = resolveSupabaseHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
