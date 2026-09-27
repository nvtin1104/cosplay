import type { MetadataRoute } from 'next';
import { getPosts, getProducts } from '../lib/api';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://honey-shop-web.nvtin1104.workers.dev';
async function allPages<T>(loader: (offset: number) => Promise<T[]>): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = await loader(offset);
    all.push(...page);
    if (page.length < 500) break;
  }
  return all;
}
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, guides] = await Promise.all([
    allPages(offset => getProducts({ limit: 500, offset })),
    allPages(offset => getPosts({ type: 'ARTICLE', limit: 500, offset })),
    allPages(offset => getPosts({ type: 'GUIDE', limit: 500, offset })),
  ]);
  const routes = ['', '/cosplay', '/blog', '/huong-dan', ...products.map(p => `/cosplay/${p.slug}`), ...articles.map(p => `/blog/${p.slug}`), ...guides.map(p => `/huong-dan/${p.slug}`)];
  return routes.map(path => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '' ? 1 : .7 }));
}
