import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { getPosts } from '../../../lib/api';

export default async function GuidePage() {
  const guides = (await getPosts()).filter((p) => p.type === 'GUIDE');

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

        {/* 3 bước thuê vuông vức / sticker */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
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
            <article
              key={item.step}
              className={`sticker min-h-64 p-7 ${
                i === 1 ? 'bg-[#ffe75c] text-[#24150e]' : 'bg-white text-[#24150e]'
              }`}
            >
              <span className="display text-6xl font-extrabold text-[#ff9b35]">
                {item.step}
              </span>
              <h2 className="display mt-4 text-3xl font-extrabold">{item.title}</h2>
              <p className="mt-3 leading-7 text-[#624b40]">{item.desc}</p>
            </article>
          ))}
        </div>

        {/* Danh sách bài hướng dẫn */}
        {guides.length > 0 && (
          <div className="mt-16">
            <h2 className="display text-4xl font-extrabold text-[#24150e]">
              Bài viết hướng dẫn chi tiết
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`/blog/${g.slug}`}
                  className="sticker flex items-center justify-between bg-white p-6 font-extrabold text-[#24150e] transition-all hover:bg-[#ffe75c]"
                >
                  <span className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#ff9b35]" />
                    <span>{g.title}</span>
                  </span>
                  <ArrowRight size={18} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
