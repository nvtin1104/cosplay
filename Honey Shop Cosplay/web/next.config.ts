import type { NextConfig } from 'next';
const apiOrigin = process.env.API_ORIGIN || 'http://localhost:8787';
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  typedRoutes: true,
  outputFileTracingRoot: __dirname,
  async rewrites() { return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }]; }
};
export default nextConfig;
