import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getPosts } from '../../../lib/api';

export default async function GuidePage() {
  const guides = (await getPosts()).filter((p) => p.type === 'GUIDE');

  return (
    <main className="min-h-screen bg-[#fffdfa] py-16">
      <div className="shell">
        <span className="inline-block rounded-full bg-[#fff5db] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#c25e00] border border-[#f5cb88]">
          ✦ Hướng dẫn thuê đồ
        </span>
        <h1 className="display mt-3 max-w-4xl text-5xl font-extrabold leading-tight text-[#382313] md:text-7xl">
          Thuê đồ vui, trả đồ cũng thật nhẹ nhàng.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#73533c]">
          Một vài lưu ý nhỏ giúp bạn có trải nghiệm thuê đồ cosplay trọn vẹn và thoải mái nhất cùng Honey Shop.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Đo size chuẩn xác',
              desc: 'Đo số đo 3 vòng (ngực, eo, mông) và chiều cao/cân nặng để shop tư vấn size vừa vặn nhất.',
              icon: '📏',
            },
            {
              step: '02',
              title: 'Kiểm tra lịch & cọc',
              desc: 'Shop xác nhận ngày cần đồ, tình trạng phụ kiện và hướng dẫn cọc giữ lịch rõ ràng.',
              icon: '🗓️',
            },
            {
              step: '03',
              title: 'Bảo quản & hoàn trả',
              desc: 'Không tự ý giặt máy hay chỉnh sửa trang phục, kiểm tra đủ phụ kiện trước khi gửi lại shop.',
              icon: '🧺',
            },
          ].map((item) => (
            <article
              key={item.step}
              className="rounded-3xl border-2 border-[#ebd7be] bg-white p-8 shadow-[0_6px_24px_rgba(245,135,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#f57400]"
            >
              <div className="flex items-center justify-between">
                <span className="display text-5xl font-extrabold text-[#f59b28]/35">
                  {item.step}
                </span>
                <span className="text-3xl">{item.icon}</span>
              </div>
              <h2 className="display mt-4 text-2xl font-extrabold text-[#382313]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#73533c]">
                {item.desc}
              </p>
            </article>
          ))}
        </div>

        {guides.length > 0 && (
          <div className="mt-16">
            <h2 className="display text-3xl font-extrabold text-[#382313]">
              Bài viết hướng dẫn chi tiết
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {guides.map((g) => (
                <Link
                  key={g.id}
                  href={`/blog/${g.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-[#ebd7be] bg-[#fffaf0] p-6 font-bold text-[#382313] transition-all hover:bg-white hover:border-[#f57400] hover:shadow-md"
                >
                  <span className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#f57400]" />
                    <span>{g.title}</span>
                  </span>
                  <ArrowRight size={18} className="text-[#f57400] transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
