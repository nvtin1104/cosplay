import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Heart, Sparkles } from 'lucide-react';
import { ProductCard } from '../../components/ProductCard';
import { Reveal } from '../../components/Reveal';
import { getPosts, getProducts } from '../../lib/api';

export default async function HomePage() {
  const [products, posts] = await Promise.all([getProducts(), getPosts()]);

  return (
    <main className="overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="grain relative min-h-[calc(100vh-84px)] border-b-2 border-[#24150e] bg-[#ff9b35] py-10 md:py-16">
        <div className="shell grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative z-10">
            <p className="mb-5 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-2 text-sm font-extrabold text-[#24150e] shadow-[4px_5px_0_#24150e]">
              <Sparkles size={16} /> cosplay rental · sài gòn
            </p>

            <h1 className="display text-[clamp(4.2rem,9vw,8.5rem)] font-extrabold leading-[.78] tracking-[-.055em] text-[#24150e]">
              MẶC VÀO<br />
              <span className="text-[#fff6dc] [text-shadow:4px_4px_0_#24150e]">NHÂN VẬT</span><br />
              BẠN YÊU.
            </h1>

            <p className="mt-7 max-w-xl text-base font-semibold leading-7 text-[#24150e] md:text-lg">
              Một kho đồ cosplay đầy màu anime, được quản lý bằng lịch thuê rõ ràng và chăm chút từ outfit đến feedback thật.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/cosplay"
                className="sticker inline-flex items-center gap-2 rounded-full bg-[#ffe75c] px-6 py-3.5 font-extrabold text-[#24150e]"
              >
                <span>Khám phá kho đồ</span>
                <ArrowUpRight size={18} />
              </Link>
              <Link
                href="#quy-trinh"
                className="rounded-full border-2 border-[#24150e] bg-[#fff6dc] px-6 py-3.5 font-extrabold text-[#24150e] transition hover:bg-white"
              >
                Thuê thế nào?
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[520px] w-full max-w-[520px]">
            <div className="absolute left-2 top-8 h-[78%] w-[70%] rotate-[-7deg] overflow-hidden border-[3px] border-[#24150e] bg-[#ffe75c] p-3 shadow-[10px_12px_0_#24150e]">
              <div className="relative h-full w-full overflow-hidden">
                <Image
                  src="/assets/production/34.png"
                  alt="Cosplay lookbook Honey Shop"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            <div className="float absolute bottom-3 right-0 h-[52%] w-[52%] rotate-[8deg] overflow-hidden rounded-[45%_55%_44%_56%] border-[3px] border-[#24150e] bg-[#fff6dc] p-2 shadow-[8px_9px_0_#24150e]">
              <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
                <Image
                  src="/assets/Fb(6).jpg"
                  alt="Feedback khách thuê cosplay"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div className="absolute right-2 top-1 rotate-6 rounded-full border-2 border-[#24150e] bg-[#ffe75c] p-5 text-center shadow-[5px_6px_0_#24150e]">
              <Heart className="mx-auto fill-[#ff9b35] text-[#24150e]" />
              <b className="display text-lg text-[#24150e]">ảnh thật!</b>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MARQUEE BANNER */}
      <div className="overflow-hidden border-b-2 border-[#24150e] bg-[#24150e] py-4 text-[#fff6dc]">
        <div className="marquee display text-3xl font-extrabold uppercase">
          <span className="pr-8">
            ANIME ✦ GAME ✦ FANTASY ✦ ORIGINAL ✦ WIG ✦ PHỤ KIỆN ✦ ANIME ✦ GAME ✦ FANTASY ✦ ORIGINAL ✦ WIG ✦ PHỤ KIỆN ✦
          </span>
          <span className="pr-8" aria-hidden>
            ANIME ✦ GAME ✦ FANTASY ✦ ORIGINAL ✦ WIG ✦ PHỤ KIỆN ✦ ANIME ✦ GAME ✦ FANTASY ✦ ORIGINAL ✦ WIG ✦ PHỤ KIỆN ✦
          </span>
        </div>
      </div>

      {/* 3. HONEY PICKS */}
      <section className="bg-[#fff6dc] py-20">
        <div className="shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-extrabold uppercase tracking-[.22em] text-[#ff9b35]">
                  Honey picks
                </p>
                <h2 className="display mt-2 text-5xl font-extrabold text-[#24150e] md:text-7xl">
                  Set đang được mê
                </h2>
              </div>
              <Link
                href="/cosplay"
                className="font-extrabold text-[#24150e] underline decoration-2 underline-offset-8 hover:text-[#ff9b35]"
              >
                Xem toàn bộ kho →
              </Link>
            </div>
          </Reveal>

          {products.length ? (
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {products.slice(0, 3).map((p, i) => (
                <Reveal key={p.id}>
                  <ProductCard product={p} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border-2 border-dashed border-[#24150e] p-10 text-center">
              <b>Kho đồ đang được cập nhật.</b>
              <p className="mt-2 text-sm text-[#624b40]">
                Hãy ghé xem các danh mục khác hoặc liên hệ fanpage nhé.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. QUY TRÌNH 3 BƯỚC */}
      <section id="quy-trinh" className="border-y-2 border-[#24150e] bg-[#ffe75c] py-20">
        <div className="shell">
          <Reveal>
            <p className="font-extrabold uppercase tracking-[.22em] text-[#24150e]">
              Không cần đoán mò
            </p>
            <h2 className="display mt-2 max-w-3xl text-5xl font-extrabold leading-[.95] text-[#24150e] md:text-7xl">
              Ba bước để hóa thân thật xinh.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ['01', 'Chọn nhân vật', 'Xem ảnh thật, giá test/fes/shoot và size đang có.'],
              ['02', 'Giữ lịch', 'Shop kiểm tra biến thể, số lượng và xác nhận cọc.'],
              ['03', 'Nhận đồ', 'Kiểm tra tình trạng, mang đi tỏa sáng rồi trả đúng hẹn.'],
            ].map(([n, t, d], i) => (
              <Reveal key={n}>
                <article
                  className={`sticker min-h-64 p-7 ${
                    i === 1 ? 'bg-[#ff9b35] text-white' : 'bg-white text-[#24150e]'
                  }`}
                >
                  <span
                    className={`display text-6xl font-extrabold ${
                      i === 1 ? 'text-[#ffe75c]' : 'text-[#ff9b35]'
                    }`}
                  >
                    {n}
                  </span>
                  <h3 className="display mt-4 text-3xl font-extrabold">{t}</h3>
                  <p className={`mt-3 leading-7 ${i === 1 ? 'text-white/90' : 'text-[#624b40]'}`}>
                    {d}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEEDBACK */}
      <section id="feedback" className="bg-[#ff9b35] py-20 text-white">
        <div className="shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <div className="relative h-[520px]">
              <div className="absolute inset-y-0 left-5 right-20 rotate-[-3deg] overflow-hidden border-[3px] border-[#24150e] bg-[#ffe75c] p-3 shadow-[10px_12px_0_#24150e]">
                <div className="relative h-full">
                  <Image
                    src="/assets/Fb(13).jpg"
                    alt="Feedback cosplay Honey Shop"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="absolute bottom-5 right-0 rotate-6 rounded-2xl border-2 border-[#24150e] bg-[#ffe75c] px-5 py-4 text-[#24150e] shadow-[6px_7px_0_#24150e]">
                <b>feedback thật 100%</b>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="font-extrabold uppercase tracking-[.22em] text-[#ffe75c]">
              Love letters
            </p>
            <h2 className="display mt-3 text-5xl font-extrabold leading-none md:text-7xl">
              Mỗi lần khách gửi ảnh là một lần Honey vui cả ngày.
            </h2>
            <blockquote className="mt-8 border-l-4 border-[#ffe75c] pl-6 text-xl leading-9">
              “Đồ lên ảnh xinh hơn mình nghĩ, shop tư vấn size kỹ và phụ kiện cũng được gói rất gọn.”
            </blockquote>
            <p className="mt-4 font-bold text-white/80">— một chiếc coser đáng yêu ở TP.HCM</p>
          </Reveal>
        </div>
      </section>

      {/* 6. NOTEBOOK */}
      <section className="bg-[#ffe75c] py-20">
        <div className="shell">
          <Reveal>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-extrabold uppercase tracking-[.22em] text-[#ff9b35]">
                  Notebook
                </p>
                <h2 className="display mt-2 text-5xl font-extrabold text-[#24150e] md:text-7xl">
                  Mẹo trước giờ biến hình
                </h2>
              </div>
              <Link
                href="/blog"
                className="hidden font-extrabold text-[#24150e] underline decoration-2 underline-offset-8 md:block hover:text-[#ff9b35]"
              >
                Đọc tất cả →
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {posts.slice(0, 2).map((post, i) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className={`sticker block min-h-64 p-7 transition hover:-translate-y-2 ${
                  i ? 'bg-[#ff9b35] text-white' : 'bg-white text-[#24150e]'
                }`}
              >
                <span className="text-xs font-extrabold uppercase tracking-widest">
                  {post.type === 'GUIDE' ? 'Hướng dẫn' : 'Chuyện Honey'}
                </span>
                <h3 className="display mt-6 text-4xl font-extrabold leading-tight">
                  {post.title}
                </h3>
                <p className={`mt-4 leading-7 ${i ? 'text-white/90' : 'text-[#624b40]'}`}>
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="grain bg-[#ff9b35] py-24 text-white">
        <div className="shell text-center">
          <Reveal>
            <p className="text-5xl">✦</p>
            <h2 className="display mx-auto mt-3 max-w-4xl text-6xl font-extrabold leading-[.9] md:text-8xl">
              Concept của bạn xứng đáng được lên hình.
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-semibold leading-7 text-white/90">
              Chọn set trước, Honey sẽ cùng bạn kiểm tra size và lịch còn trống.
            </p>
            <Link
              href="/cosplay"
              className="sticker mt-8 inline-flex items-center rounded-full bg-[#ffe75c] px-7 py-4 font-extrabold text-[#24150e]"
            >
              <span>Bắt đầu chọn đồ</span>
              <ArrowUpRight className="ml-2" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: 'Honey Shop Cosplay',
            description: 'Dịch vụ cho thuê đồ cosplay tại TP.HCM',
          }),
        }}
      />
    </main>
  );
}
