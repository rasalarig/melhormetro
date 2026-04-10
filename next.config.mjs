/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  serverActions: {
    bodySizeLimit: '100mb',
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', '@anthropic-ai/sdk', 'openai'],
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config) => {
    // Cache in memory only — avoids Windows file lock corruption
    config.cache = { type: 'memory' };
    config.watchOptions = {
      poll: 2000,
      aggregateTimeout: 500,
      ignored: ['**/node_modules', '**/.git', '**/.next'],
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
};

export default nextConfig;
