import Link from 'next/link';
import type { Route } from 'next';
import type { Post } from '../lib/types';

export function PostDetail({ post, back }: { post: Post; back: Route }) {
  return <main className="min-h-screen bg-[#fff6dc] py-14"><article className="shell max-w-3xl">
    <Link href={back} className="text-sm font-extrabold text-[#24150e] hover:text-[#f07d24]">← {post.type === 'GUIDE' ? 'Về danh sách hướng dẫn' : 'Về danh sách bài viết'}</Link>
    <div className="sticker mt-7 bg-white p-7 shadow-[8px_10px_0_#24150e] md:p-12">
      <span className="inline-block border-2 border-[#24150e] bg-[#ffe75c] px-3 py-1 text-xs font-extrabold uppercase">{post.categoryName || (post.type === 'GUIDE' ? 'Hướng dẫn' : 'Bài viết')}</span>
      <h1 className="display mt-5 text-4xl font-extrabold leading-tight text-[#24150e] md:text-6xl">{post.title}</h1>
      {post.excerpt && <p className="mt-6 text-lg leading-8 text-[#624b40]">{post.excerpt}</p>}
      {post.type === 'ARTICLE' && post.coverUrl && <img src={post.coverUrl} alt={post.title} className="mt-8 max-h-[520px] w-full object-cover" />}
      <div className="prose-content mt-10 border-t-2 border-dashed border-[#24150e]/30 pt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  </article></main>;
}
