import type { NextConfig } from 'next';

const apiOrigin = process.env.API_ORIGIN || 'https://honey-shop-api.nvtin1104.workers.dev';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  typedRoutes: true,
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
