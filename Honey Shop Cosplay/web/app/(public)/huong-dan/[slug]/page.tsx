import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PostDetail } from '../../../../components/PostDetail';
import { getPost } from '../../../../lib/api';
import { postMetadata } from '../../../../lib/postMetadata';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return post?.type === 'GUIDE' ? postMetadata(post, `/huong-dan/${slug}`) : {};
}
export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.type !== 'GUIDE') notFound();
  return <PostDetail post={post} back="/huong-dan" />;
}
