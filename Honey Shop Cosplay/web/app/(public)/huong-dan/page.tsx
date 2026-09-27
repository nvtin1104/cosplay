import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowDown, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
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

        {/* Các bước thuê dạng accordion để dễ đọc trên cả điện thoại và máy tính. */}
        <div className="mt-12 grid gap-4">
          {[
            {
              step: '01',
              title: 'Đo size chuẩn xác',
              desc: 'Đo số đo 3 vòng (ngực, eo, mông) và chiều cao/cân nặng để shop tư vấn size vừa vặn nhất.',
            },
            {
              step: '02',
              title: 'Kiểm tra lịch & cọc',
              desc: 'Shop xác nhận ngày cần đồ, tình trạng phụ kiện và hướng dẫn cọc giữ lịch rõ ràng.',
            },
            {
              step: '03',
              title: 'Bảo quản & hoàn trả',
              desc: 'Không tự ý giặt máy hay chỉnh sửa trang phục, kiểm tra đủ phụ kiện trước khi gửi lại shop.',
            },
          ].map((item, i) => (
            <details key={item.step} name="rental-steps" className={`group sticker overflow-hidden ${i === 1 ? 'bg-[#ffe75c]' : 'bg-white'}`} open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-5 p-5 sm:p-7 [&::-webkit-details-marker]:hidden">
                <span className="display shrink-0 text-4xl font-extrabold text-[#ff9b35] sm:text-6xl">{item.step}</span>
                <span className="display flex-1 text-xl font-extrabold text-[#24150e] sm:text-3xl">{item.title}</span>
                <ArrowDown size={22} className="shrink-0 text-[#624b40] transition-transform group-open:rotate-180" />
              </summary>
              <p className="max-w-3xl border-t border-[#24150e]/15 px-5 pb-6 pt-4 leading-7 text-[#624b40] sm:px-7 sm:pb-7 sm:pl-[6.5rem]">{item.desc}</p>
            </details>
          ))}
        </div>

        {/* Danh sách bài hướng dẫn */}
        {guides.length > 0 && (
          <div className="mt-16">
            <h2 className="display text-4xl font-extrabold text-[#24150e]">
              Bài viết hướng dẫn chi tiết
            </h2>
            <div className="mt-6 space-y-4">
              {guides.map((g) => (
                <details key={g.id} name="guide-articles" className="group sticker overflow-hidden bg-white text-[#24150e]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-extrabold sm:p-6 [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#ff9b35]" />
                    <span>{g.title}</span>
                  </span>
                  <ArrowDown size={18} className="shrink-0 transition-transform group-open:rotate-180" /></summary>
                  <div className="border-t border-dashed border-[#24150e]/20 px-5 pb-6 sm:px-6">
                    <div className="prose-content pt-5" dangerouslySetInnerHTML={{ __html: g.content }} />
                    <Link href={`/huong-dan/${g.slug}`} className="mt-4 inline-flex items-center gap-2 font-bold text-[#b4570a] underline">Xem hướng dẫn riêng <ArrowRight size={16} /></Link>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
