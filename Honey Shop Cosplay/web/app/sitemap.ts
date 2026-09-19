import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://honey-shop-web.nvtin1104.workers.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/cosplay',
    '/cosplay/anya-forger-dress',
    '/cosplay/gojo-satoru-infinity-set',
    '/cosplay/custom-witch-set',
    '/blog',
    '/blog/cach-chon-size-do-cosplay',
    '/blog/honey-shop-tai-le-hoi-mua-he',
    '/huong-dan',
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path.startsWith('/cosplay') ? 0.8 : 0.6,
  }));
}

