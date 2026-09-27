import type { Category, Post, PostCategory, Product, ProductTag, SiteSettings } from './types';

const isDev = process.env.NODE_ENV === 'development';
const serverOrigin = process.env.API_ORIGIN || (isDev ? 'http://127.0.0.1:8787' : 'https://honey-shop-api.nvtin1104.workers.dev');
async function request<T>(path: string, fallback: T): Promise<T> {
  try { const response = await fetch(`${serverOrigin}/api/v1${path}`, { cache: 'no-store' }); if (!response.ok) return fallback; return await response.json() as T; } catch { return fallback; }
}
export const getProducts = (filters: { category?: string; tag?: string; limit?: number; offset?: number } = {}) => request<Product[]>(`/products?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])).toString()}`, []);
export const getProduct = (slug: string) => request<Product | null>(`/products/${slug}`, null);
export const getCategories = () => request<Category[]>('/categories', []);
export const getTags = () => request<ProductTag[]>('/tags', []);
export const getPostCategories = () => request<PostCategory[]>('/post-categories', []);
export const getSettings = () => request<Partial<SiteSettings>>('/settings', {});
export const getPosts = (filters: { type?: 'ARTICLE' | 'GUIDE'; category?: string; limit?: number; offset?: number } = {}) => request<Post[]>(`/posts?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)])).toString()}`, []);
export const getPost = (slug: string) => request<Post | null>(`/posts/${slug}`, null);
