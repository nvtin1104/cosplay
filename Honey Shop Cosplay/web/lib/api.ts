import type { Post, Product } from './types';

const serverOrigin = process.env.API_ORIGIN || 'http://localhost:8787';
async function request<T>(path: string, fallback: T): Promise<T> {
  try { const response = await fetch(`${serverOrigin}/api/v1${path}`, { next: { revalidate: 60 } }); if (!response.ok) return fallback; return await response.json() as T; } catch { return fallback; }
}
export const getProducts = () => request<Product[]>('/products', []);
export const getProduct = (slug: string) => request<Product | null>(`/products/${slug}`, null);
export const getPosts = () => request<Post[]>('/posts', []);
export const getPost = (slug: string) => request<Post | null>(`/posts/${slug}`, null);
