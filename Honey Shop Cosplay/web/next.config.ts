import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
const apiOrigin = process.env.API_ORIGIN || (isDev ? 'http://127.0.0.1:8787' : 'https://honey-shop-api.nvtin1104.workers.dev');

const nextConfig: NextConfig = {
  ...(!isDev ? { output: 'export' } : {}),
  images: { unoptimized: true },
  typedRoutes: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

