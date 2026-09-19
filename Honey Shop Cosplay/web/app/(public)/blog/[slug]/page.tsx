import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPost, getPosts } from '../../../../lib/api';

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#fff6dc] py-14">
      <article className="shell max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#24150e] hover:text-[#f07d24] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Về danh sách bài viết</span>
        </Link>

        <div className="sticker mt-7 bg-white p-7 md:p-12 shadow-[8px_10px_0_#24150e]">
          <span className="inline-block border-2 border-[#24150e] bg-[#ffe75c] px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-[#24150e] shadow-[2px_3px_0_#24150e]">
            {post.type === 'GUIDE' ? 'Hướng dẫn' : 'Chuyện Honey'}
          </span>

          <h1 className="display mt-5 text-4xl font-extrabold leading-tight text-[#24150e] md:text-6xl">
            {post.title}
          </h1>

          <p className="mt-6 text-lg font-medium leading-8 text-[#624b40] md:text-xl">
            {post.excerpt}
          </p>

          <div className="mt-10 border-t-2 border-dashed border-[#24150e]/30 pt-8 text-base leading-8 whitespace-pre-wrap text-[#24150e]">
            {post.content}
          </div>
        </div>
      </article>
    </main>
  );
}
