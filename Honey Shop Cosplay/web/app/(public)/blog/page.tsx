import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getPosts } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Chuyện Honey',
  description: 'Nhật ký, kinh nghiệm cosplay và các mẹo nhỏ từ Honey Shop.',
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-[#fff6dc] py-16">
      <div className="shell">
        <p className="mb-4 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-1.5 text-xs font-extrabold text-[#24150e] shadow-[4px_5px_0_#24150e]">
          <Sparkles size={14} /> journal · honey stories
        </p>

        <h1 className="display max-w-4xl text-5xl font-extrabold leading-[.9] text-[#24150e] md:text-7xl">
          Chuyện ở Honey
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#624b40] md:text-lg">
          Nơi lưu giữ những câu chuyện cosplay đáng yêu, mẹo chọn trang phục và hướng dẫn đi fes trọn vẹn.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((p, i) => (
            <Link
              href={`/blog/${p.slug}`}
              key={p.id}
              className={`sticker block min-h-72 p-8 transition hover:-translate-y-2 ${
                i % 2 !== 0 ? 'bg-[#ff9b35] text-white' : 'bg-white text-[#24150e]'
              }`}
            >
              <span
                className={`text-xs font-extrabold uppercase tracking-widest ${
                  i % 2 !== 0 ? 'text-[#ffe75c]' : 'text-[#ff9b35]'
                }`}
              >
                {p.type === 'GUIDE' ? 'Hướng dẫn' : 'Bài viết'}
              </span>

              <h2 className="display mt-5 text-3xl font-extrabold leading-snug md:text-4xl">
                {p.title}
              </h2>

              <p className={`mt-4 leading-7 ${i % 2 !== 0 ? 'text-white/90' : 'text-[#624b40]'}`}>
                {p.excerpt}
              </p>

              <div className="mt-8 flex items-center gap-2 font-extrabold">
                <span>Đọc bài viết</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
