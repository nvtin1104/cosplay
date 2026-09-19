import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/cosplay', '/blog', '/huong-dan'].map((path) => ({
    url: `https://honey-shop.example${path}`,
    lastModified: new Date(),
  }));
}
