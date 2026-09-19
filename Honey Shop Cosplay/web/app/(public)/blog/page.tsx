import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { getPosts } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Chuyện Honey',
  description: 'Nhật ký, kinh nghiệm cosplay và các mẹo nhỏ từ Honey Shop.',
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-[#fffdfa] py-16">
      <div className="shell">
        <span className="inline-block rounded-full bg-[#fff5db] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#c25e00] border border-[#f5cb88]">
          ✦ Nhật ký & Chia sẻ
        </span>
        <h1 className="display mt-3 text-5xl font-extrabold text-[#382313] md:text-7xl">
          Chuyện ở Honey
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#73533c]">
          Nơi lưu giữ những câu chuyện cosplay đáng yêu, mẹo chọn trang phục và hướng dẫn đi fes trọn vẹn.
        </p>

        <div className="mt-12 grid gap-7 md:grid-cols-2">
          {posts.map((p) => (
            <Link
              href={`/blog/${p.slug}`}
              key={p.id}
              className="group block rounded-3xl border-2 border-[#ebd7be] bg-white p-8 shadow-[0_6px_24px_rgba(245,135,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#f57400] hover:shadow-[0_12px_32px_rgba(245,135,0,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block rounded-full bg-[#fff2db] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#b85900] border border-[#ffd58a]">
                  {p.type === 'GUIDE' ? 'Hướng dẫn' : 'Bài viết'}
                </span>
                <BookOpen size={18} className="text-[#f57400]" />
              </div>

              <h2 className="display mt-5 text-2xl font-extrabold leading-snug text-[#382313] transition-colors group-hover:text-[#f57400]">
                {p.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#73533c] line-clamp-3">
                {p.excerpt}
              </p>

              <div className="mt-6 flex items-center gap-2 border-t border-[#f0ded0] pt-4 text-xs font-extrabold text-[#e06900]">
                <span>Đọc bài viết</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
