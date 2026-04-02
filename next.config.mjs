/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pg', '@anthropic-ai/sdk', 'openai'],
  },
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
