import type { Metadata } from 'next';
import type { Post } from './types';

export function postMetadata(post: Post, path: string): Metadata {
  const description = post.seoDescription || post.excerpt || post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const title = post.seoTitle || post.title;
  return { title, description, alternates: { canonical: path }, openGraph: { type: 'article', title, description, url: path, images: post.coverUrl ? [{ url: post.coverUrl }] : undefined } };
}
