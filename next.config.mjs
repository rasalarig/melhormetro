/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
    ];
    if (isProd) {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.googleapis.com https://maps.gstatic.com https://*.ggpht.com https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.cloudflare.com *; media-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.r2.dev *; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.instagram.com https://www.google.com https://maps.google.com; connect-src 'self' https://maps.googleapis.com https://*.r2.cloudflarestorage.com https://*.r2.dev; font-src 'self' data: https://fonts.gstatic.com;"
      });
    }
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      }
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', '@anthropic-ai/sdk', 'openai', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg'],
    workerThreads: false,
    cpus: 1,
    serverActions: {
      bodySizeLimit: '20mb',
    },
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
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.GOOGLE_MAPS_KEY,
  },
};

export default nextConfig;
