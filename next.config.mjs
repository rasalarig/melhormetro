/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', '@anthropic-ai/sdk', 'openai'],
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
