import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowDown, ArrowRight, Sparkles } from 'lucide-react';
import { getPosts } from '../../../lib/api';

export const metadata: Metadata = { title: 'Hướng dẫn thuê đồ', description: 'Các hướng dẫn thuê và sử dụng trang phục cosplay tại Honey Shop.', alternates: { canonical: '/huong-dan' } };

export default async function GuidePage() {
  const guides = await getPosts({ type: 'GUIDE', limit: 500 });

  return (
    <main className="min-h-screen bg-[#fff6dc] py-16">
      <div className="shell">
        <p className="mb-4 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-1.5 text-xs font-extrabold text-[#24150e] shadow-[4px_5px_0_#24150e]">
          <Sparkles size={14} /> how to rent · honey tips
        </p>

        <h1 className="display max-w-4xl text-5xl font-extrabold leading-[.9] text-[#24150e] md:text-8xl">
          Thuê đồ vui, trả đồ cũng thật nhẹ nhàng.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#624b40] md:text-lg">
          Một vài lưu ý nhỏ giúp bạn có trải nghiệm thuê đồ cosplay trọn vẹn và thoải mái nhất cùng Honey Shop.
        </p>

        <div className="mt-12">
          <h2 className="display text-4xl font-extrabold text-[#24150e]">Hướng dẫn từ Honey Shop</h2>
          <p className="mt-2 max-w-2xl leading-7 text-[#624b40]">Thông tin bên dưới được cập nhật trực tiếp từ hệ thống hướng dẫn của shop.</p>
          {guides.length > 0 ? (
            <div className="mt-6 space-y-4">
              {guides.map((g, index) => (
                <details key={g.id} name="guide-articles" className={`group sticker overflow-hidden text-[#24150e] ${index % 3 === 1 ? 'bg-[#ffe75c]' : 'bg-white'}`} open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-extrabold sm:p-6 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[#24150e] bg-white text-sm font-black text-[#ff9b35]">{String(index + 1).padStart(2, '0')}</span>
                    <span>{g.title}</span>
                  </span>
                  <ArrowDown size={18} className="shrink-0 transition-transform group-open:rotate-180" /></summary>
                  <div className="border-t border-dashed border-[#24150e]/20 px-5 pb-6 sm:px-6">
                    {g.excerpt && <p className="pt-4 font-semibold text-[#624b40]">{g.excerpt}</p>}
                    <div className="prose-content pt-5" dangerouslySetInnerHTML={{ __html: g.content }} />
                    <Link href={`/huong-dan/${g.slug}`} className="mt-4 inline-flex items-center gap-2 font-bold text-[#b4570a] underline">Xem hướng dẫn riêng <ArrowRight size={16} /></Link>
                  </div>
                </details>
              ))}
            </div>
          ) : <div className="mt-6 rounded-2xl border-2 border-dashed border-[#24150e]/30 bg-white/70 p-8 text-center text-[#624b40]">Shop đang cập nhật hướng dẫn. Bạn có thể nhắn Honey để được hỗ trợ trực tiếp.</div>}
        </div>
      </div>
    </main>
  );
}
