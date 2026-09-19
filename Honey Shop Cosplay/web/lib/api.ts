import type { Post, Product } from './types';

const isDev = process.env.NODE_ENV === 'development';
const serverOrigin = process.env.API_ORIGIN || (isDev ? 'http://127.0.0.1:8787' : 'https://honey-shop-api.nvtin1104.workers.dev');
async function request<T>(path: string, fallback: T): Promise<T> {
  try { const response = await fetch(`${serverOrigin}/api/v1${path}`, { next: { revalidate: 60 } }); if (!response.ok) return fallback; return await response.json() as T; } catch { return fallback; }
}
export const getProducts = () => request<Product[]>('/products', []);
export const getProduct = (slug: string) => request<Product | null>(`/products/${slug}`, null);
export const getPosts = () => request<Post[]>('/posts', []);
export const getPost = (slug: string) => request<Post | null>(`/posts/${slug}`, null);
