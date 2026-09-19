import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, Heart, Sparkles, Star } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { Reveal } from '../../components/Reveal';
import { getPosts, getProducts } from '../../lib/api';

export default async function HomePage() {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);

  return (
    <main className="overflow-hidden bg-[#fffdfa] text-[#382313]">
      {/* 1. HERO SECTION */}
      <section className="grain relative border-b border-[#ebd7be] bg-gradient-to-b from-[#fffaf0] via-[#fff4dc] to-[#ffeed0] py-12 md:py-20">
        <div className="shell grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left Text */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5cb88] bg-[#fff5db] px-4 py-1.5 text-xs font-extrabold text-[#c25e00] shadow-sm">
              <span className="text-base">🍯</span>
              <span>Tiệm cho thuê đồ cosplay xinh xắn tại Sài Gòn</span>
            </div>

            <h1 className="display mt-5 text-[clamp(3.5rem,7.5vw,6.8rem)] font-extrabold leading-[0.94] tracking-tight text-[#382313]">
              HÓA THÂN VÀO <br />
              <span className="relative inline-block text-[#f57400]">
                NHÂN VẬT
                <span className="absolute -bottom-1 left-0 -z-10 h-3 w-full rounded-full bg-[#ffc425]/50" />
              </span>{' '}
              <br />
              BẠN YÊU THÍCH.
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-[#73533c] md:text-lg">
              Một kho đồ cosplay phong phú với ảnh thật 100%, đồ luôn được giặt sạch thơm, 
              kèm đầy đủ phụ kiện và tư vấn kỹ size để bạn an tâm tỏa sáng trong từng khung hình.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/cosplay"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9b28] to-[#f57400] px-7 py-3.5 text-base font-extrabold text-white shadow-[0_6px_20px_rgba(245,116,0,0.3)] transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_25px_rgba(245,116,0,0.38)] active:scale-95"
              >
                <span>Khám phá kho đồ</span>
                <Sparkles size={18} />
              </Link>
              <Link
                href="#quy-trinh"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#ebd7be] bg-white px-6 py-3.5 text-base font-bold text-[#4e3422] shadow-sm transition-all duration-200 hover:border-[#f58700] hover:bg-[#fff9ef] active:scale-95"
              >
                <span>Cách thuê thế nào?</span>
              </Link>
            </div>

            {/* Quick mini highlights */}
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-[#ebd7be]/60 pt-6 text-xs font-bold text-[#8c674b]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#f57400]" />
                Ảnh chụp đồ thật tại shop
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#f57400]" />
                Đồ thơm sạch & phụ kiện đầy đủ
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#f57400]" />
                Giữ lịch cọc rõ ràng
              </span>
            </div>
          </div>

          {/* Right Visual Showcase */}
          <div className="relative mx-auto h-[480px] w-full max-w-[480px]">
            {/* Main Photo Card */}
            <div className="absolute left-2 top-4 h-[84%] w-[72%] rotate-[-4deg] overflow-hidden rounded-3xl border-4 border-white bg-[#fff5e2] p-2.5 shadow-[0_16px_36px_rgba(217,119,6,0.18)] transition-transform duration-300 hover:rotate-0">
              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src="/assets/production/34.png"
                  alt="Cosplay lookbook Honey Shop"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            {/* Sub Floating Card (Feedback) */}
            <div className="float-slow absolute bottom-2 right-1 h-[52%] w-[54%] rotate-[5deg] overflow-hidden rounded-3xl border-4 border-white bg-[#fff9ed] p-2 shadow-[0_12px_32px_rgba(217,119,6,0.16)] transition-transform duration-300 hover:rotate-0">
              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src="/assets/Fb(6).jpg"
                  alt="Feedback khách thuê cosplay thật"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Cute Floating Pill Badge */}
            <div className="float-reverse absolute -left-2 bottom-8 rounded-full border border-[#f5cb88] bg-[#fffcf5] px-4 py-2.5 shadow-[0_8px_20px_rgba(245,135,0,0.18)]">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffeed0] text-sm text-[#f57400]">
                  <Heart size={14} className="fill-[#f57400]" />
                </span>
                <div>
                  <b className="display block text-sm font-extrabold text-[#382313] leading-none">100% đồ thật</b>
                  <span className="text-[10px] font-semibold text-[#8c674b]">feedback từ khách</span>
                </div>
              </div>
            </div>

            {/* Top right sticker */}
            <div className="absolute -top-3 right-4 rounded-2xl border border-[#ffd58a] bg-[#ffeed0] px-3.5 py-2 text-center shadow-md">
              <span className="flex items-center justify-center gap-1 text-xs font-extrabold text-[#b85900]">
                <Star size={13} className="fill-[#f57400] text-[#f57400]" />
                <span>UY TÍN & TẬN TÂM</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MARQUEE BANNER */}
      <div className="overflow-hidden border-b border-[#e06900] bg-gradient-to-r from-[#ff9b28] via-[#f57400] to-[#e06900] py-3 text-white shadow-inner">
        <div className="marquee display text-xl font-extrabold tracking-wider uppercase">
          <span className="pr-10 flex items-center gap-6">
            <span>🍯 HONEY SHOP</span>
            <span>✦</span>
            <span>ANIME & GAME COSPLAY</span>
            <span>✦</span>
            <span>WIG TẠO KIỂU XINH</span>
            <span>✦</span>
            <span>PHỤ KIỆN CHỈN CHU</span>
            <span>✦</span>
            <span>GIÁ HỌC SINH</span>
            <span>✦</span>
            <span>ĐỒ THƠM SẠCH 100%</span>
            <span>✦</span>
          </span>
          <span className="pr-10 flex items-center gap-6" aria-hidden>
            <span>🍯 HONEY SHOP</span>
            <span>✦</span>
            <span>ANIME & GAME COSPLAY</span>
            <span>✦</span>
            <span>WIG TẠO KIỂU XINH</span>
            <span>✦</span>
            <span>PHỤ KIỆN CHỈN CHU</span>
            <span>✦</span>
            <span>GIÁ HỌC SINH</span>
            <span>✦</span>
            <span>ĐỒ THƠM SẠCH 100%</span>
            <span>✦</span>
          </span>
        </div>
      </div>

      {/* 3. HONEY PICKS - FEATURED PRODUCTS */}
      <section className="bg-[#fffdfa] py-16 md:py-24">
        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#f0ded0] pb-6">
              <div>
                <span className="inline-block rounded-full bg-[#fffae8] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#d96600] border border-[#fadc85]">
                  ✦ Honey Picks
                </span>
                <h2 className="display mt-2.5 text-4xl font-extrabold text-[#382313] md:text-6xl">
                  Set cosplay đang được mê mẩn
                </h2>
                <p className="mt-2 text-sm text-[#7a5b44]">
                  Những bộ trang phục hot nhất, đầy đủ phụ kiện và luôn sẵn sàng cho buổi hóa thân của bạn.
                </p>
              </div>
              <Link
                href="/cosplay"
                className="group inline-flex items-center gap-1.5 text-sm font-extrabold text-[#e06900] transition-colors hover:text-[#b85400]"
              >
                <span>Xem toàn bộ kho đồ</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          {products.length ? (
            <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((p, i) => (
                <Reveal key={p.id}>
                  <ProductCard product={p} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border-2 border-dashed border-[#ebd7be] bg-[#fffaf0] p-12 text-center">
              <span className="text-4xl">🍯</span>
              <h3 className="display mt-3 text-2xl font-bold text-[#382313]">Kho đồ đang được cập nhật thêm</h3>
              <p className="mt-2 text-sm text-[#8c674b]">
                Hãy ghé xem các danh mục khác hoặc liên hệ fanpage để shop gửi mẫu nhanh nhất nhé!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. THREE SIMPLE STEPS (QUY TRÌNH THUÊ) */}
      <section id="quy-trinh" className="border-y border-[#ebd7be] bg-gradient-to-b from-[#fff6e4] via-[#ffeed2] to-[#fff5e2] py-16 md:py-24">
        <div className="shell">
          <Reveal>
            <div className="text-center">
              <span className="inline-block rounded-full bg-[#fff5db] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#c25e00] border border-[#f5cb88]">
                ✦ Quy trình đơn giản
              </span>
              <h2 className="display mx-auto mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-[#382313] md:text-6xl">
                Ba bước nhẹ tênh để hóa thân thật xinh
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-base text-[#73533c]">
                Không cần lo lắng về size hay phụ kiện thất lạc, Honey luôn hướng dẫn bạn rõ ràng từng bước.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                num: '01',
                badge: 'Bước 1',
                title: 'Chọn set & check size',
                desc: 'Xem ảnh thật của từng set, kiểm tra số đo chiều cao/cân nặng và chọn gói thuê chụp ảnh hoặc đi festival.',
                icon: '🎀',
              },
              {
                num: '02',
                badge: 'Bước 2',
                title: 'Giữ lịch & đặt cọc',
                desc: 'Shop xác nhận ngày cần đồ, hướng dẫn cọc giữ lịch minh bạch và tiến hành giặt ủi, chải wig, gói phụ kiện.',
                icon: '🍯',
              },
              {
                num: '03',
                badge: 'Bước 3',
                title: 'Nhận đồ & tỏa sáng',
                desc: 'Nhận đồ thơm tho tại shop hoặc ship tận nơi. Tự tin đi fes/shoot rồi hoàn trả đồ theo đúng ngày đã hẹn.',
                icon: '✨',
              },
            ].map((step, i) => (
              <Reveal key={step.num}>
                <article className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#ebd7be] bg-white p-8 shadow-[0_6px_24px_rgba(245,135,0,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-[#f57400] hover:shadow-[0_12px_32px_rgba(245,135,0,0.12)]">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="display text-5xl font-extrabold text-[#f59b28]/35">
                        {step.num}
                      </span>
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2db] text-2xl shadow-sm">
                        {step.icon}
                      </span>
                    </div>
                    <span className="mt-4 inline-block rounded-full bg-[#fffae8] px-2.5 py-0.5 text-xs font-extrabold text-[#d96600] border border-[#fadc85]">
                      {step.badge}
                    </span>
                    <h3 className="display mt-3 text-2xl font-extrabold text-[#382313]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#73533c]">
                      {step.desc}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEEDBACK & LOVE LETTERS */}
      <section id="feedback" className="bg-[#fffdfa] py-16 md:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Feedback Photo */}
          <Reveal>
            <div className="relative mx-auto h-[460px] w-full max-w-[460px]">
              <div className="relative h-full w-full rotate-[-2deg] overflow-hidden rounded-3xl border-4 border-white bg-[#fff5e2] p-3 shadow-[0_16px_40px_rgba(217,119,6,0.15)] transition-transform duration-300 hover:rotate-0">
                <div className="relative h-full w-full overflow-hidden rounded-2xl">
                  <Image
                    src="/assets/Fb(13).jpg"
                    alt="Feedback cosplay Honey Shop"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-4 right-4 rounded-2xl border border-[#f5cb88] bg-[#fff5db] px-5 py-3 shadow-[0_6px_20px_rgba(245,135,0,0.18)]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💌</span>
                  <div>
                    <b className="display block text-sm font-extrabold text-[#382313] leading-none">Feedback chân thật</b>
                    <span className="text-[11px] font-semibold text-[#8c674b]">từ coser Sài Gòn</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Love Letter Content */}
          <Reveal>
            <div>
              <span className="inline-block rounded-full bg-[#fffae8] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#d96600] border border-[#fadc85]">
                ✦ Lời nhắn yêu thương
              </span>
              <h2 className="display mt-3 text-4xl font-extrabold leading-tight text-[#382313] md:text-5xl">
                Mỗi bức ảnh khách gửi về là niềm vui to lớn của Honey.
              </h2>
              <blockquote className="mt-6 rounded-2xl border-l-4 border-[#f57400] bg-[#fffaf0] p-5 text-base leading-relaxed text-[#5c3e29] italic shadow-sm">
                “Đồ lên dáng rất xinh, wig được chải chuốt cẩn thận, phụ kiện đóng hộp ngăn nắp. 
                Chị chủ shop lại siêu dễ thương và nhiệt tình hỗ trợ nữa ạ!”
              </blockquote>
              <p className="mt-3 font-bold text-[#8c674b]">
                — Một bạn coser đáng yêu tại TP.HCM
              </p>

              {/* Service commitment pills */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 border-t border-[#f0ded0]">
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#ebd7be] bg-[#fffcf5] p-3">
                  <span className="text-lg">🧼</span>
                  <span className="text-xs font-bold text-[#4e3422]">Đồ giặt sạch thơm sau mỗi lần thuê</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#ebd7be] bg-[#fffcf5] p-3">
                  <span className="text-lg">📏</span>
                  <span className="text-xs font-bold text-[#4e3422]">Tư vấn chuẩn size trước khi gửi</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#ebd7be] bg-[#fffcf5] p-3">
                  <span className="text-lg">📦</span>
                  <span className="text-xs font-bold text-[#4e3422]">Phụ kiện đóng hộp gọn gàng</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-[#ebd7be] bg-[#fffcf5] p-3">
                  <span className="text-lg">💬</span>
                  <span className="text-xs font-bold text-[#4e3422]">Hỗ trợ nhanh qua fanpage & Zalo</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. NOTEBOOK / BLOG & TIPS */}
      <section className="border-t border-[#ebd7be] bg-[#fffbf2] py-16 md:py-24">
        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#f0ded0] pb-6">
              <div>
                <span className="inline-block rounded-full bg-[#fff5db] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#c25e00] border border-[#f5cb88]">
                  ✦ Góc chia sẻ & mẹo nhỏ
                </span>
                <h2 className="display mt-2.5 text-4xl font-extrabold text-[#382313] md:text-5xl">
                  Trước giờ biến hình
                </h2>
              </div>
              <Link
                href="/blog"
                className="group hidden items-center gap-1.5 text-sm font-extrabold text-[#e06900] md:flex hover:text-[#b85400]"
              >
                <span>Xem tất cả bài viết</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {posts.slice(0, 2).map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="group block overflow-hidden rounded-3xl border-2 border-[#ebd7be] bg-white p-7 shadow-[0_6px_24px_rgba(245,135,0,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#f57400] hover:shadow-[0_12px_32px_rgba(245,135,0,0.12)]"
              >
                <span className="inline-block rounded-full bg-[#fff2db] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#b85900] border border-[#ffd58a]">
                  {post.type === 'GUIDE' ? 'Hướng dẫn' : 'Chuyện Honey'}
                </span>
                <h3 className="display mt-4 text-2xl font-extrabold leading-snug text-[#382313] transition-colors group-hover:text-[#f57400]">
                  {post.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#73533c] line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs font-extrabold text-[#e06900]">
                  <span>Đọc tiếp</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION */}
      <section className="bg-[#fffdfa] py-16 md:py-24">
        <div className="shell">
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-[#ff9b28] via-[#f57400] to-[#d96600] px-8 py-14 text-center text-white shadow-[0_16px_40px_rgba(245,116,0,0.22)] md:px-14 md:py-18">
            {/* Background decoration elements */}
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <Reveal>
              <span className="inline-block text-4xl">🍯</span>
              <h2 className="display mx-auto mt-3 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
                Concept bạn ấp ủ xứng đáng được lên hình lung linh nhất.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base font-medium text-white/90 md:text-lg">
                Chọn set bạn yêu thích, Honey sẽ kiểm tra size và hỗ trợ giữ lịch cho bạn ngay trong hôm nay nhé!
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/cosplay"
                  className="inline-flex items-center gap-2 rounded-full bg-[#fffaf0] px-8 py-4 text-base font-extrabold text-[#c25000] shadow-lg transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-xl active:scale-95"
                >
                  <span>Bắt đầu chọn đồ</span>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SEO Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'Honey Shop Cosplay',
            description: 'Dịch vụ cho thuê đồ cosplay uy tín, ảnh thật tại TP.HCM',
          }),
        }}
      />
    </main>
  );
}
