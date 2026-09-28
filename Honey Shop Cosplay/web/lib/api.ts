import type { Category, Post, PostCategory, Product, ProductTag, SiteSettings } from './types';
import { getCloudflareApi } from './cloudflare-env';

const isDev = process.env.NODE_ENV === 'development';
const serverOrigin = process.env.API_ORIGIN || (isDev ? 'http://127.0.0.1:8787' : 'https://api.honeyshopcosplay.likecactus.com');
async function request<T>(path: string, fallback: T): Promise<T> {
  try {
    const url = `${serverOrigin}/api/v1${path}`;
    const api = await getCloudflareApi();
    const response = api
      ? await api.fetch(new Request(url, { headers: { Accept: 'application/json' } }))
      : await fetch(url, { cache: 'no-store' });
    if (!response.ok) return fallback;
    return await response.json() as T;
  } catch { return fallback; }
}
export const getProducts = (filters: { category?: string; tag?: string; limit?: number; offset?: number } = {}) => request<Product[]>(`/products?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])).toString()}`, []);
export const getProduct = (slug: string) => request<Product | null>(`/products/${slug}`, null);
export const getCategories = () => request<Category[]>('/categories', []);
export const getTags = () => request<ProductTag[]>('/tags', []);
export const getPostCategories = () => request<PostCategory[]>('/post-categories', []);
export const getSettings = () => request<Partial<SiteSettings>>('/settings', {});
export const getPosts = (filters: { type?: 'ARTICLE' | 'GUIDE'; category?: string; limit?: number; offset?: number } = {}) => request<Post[]>(`/posts?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])).toString()}`, []);
export const getPost = (slug: string) => request<Post | null>(`/posts/${slug}`, null);
