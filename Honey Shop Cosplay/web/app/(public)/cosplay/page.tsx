import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { ProductCard } from '../../../components/ProductCard';
import { getProducts } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Kho đồ cosplay',
  description: 'Xem các set cosplay, giá test/fes/shoot và tình trạng đang có tại Honey Shop.',
};

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[#fff6dc] py-14">
      <div className="shell">
        <p className="mb-4 inline-flex rotate-[-2deg] items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-1.5 text-xs font-extrabold text-[#24150e] shadow-[4px_5px_0_#24150e]">
          <Sparkles size={14} /> cosplay closet · sài gòn
        </p>

        <h1 className="display max-w-4xl text-5xl font-extrabold leading-[.9] text-[#24150e] md:text-8xl">
          Chọn một nhân vật. Viết một câu chuyện.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#624b40] md:text-lg">
          Toàn bộ set đồ tại Honey đều có ảnh chụp thật 100%, được bảo quản thơm tho và kiểm tra phụ kiện kỹ càng trước ngày bạn nhận đồ.
        </p>

        {/* Filter categories theo style sticker vuông vức */}
        <div className="mt-8 flex flex-wrap gap-3">
          {['Tất cả', 'Anime', 'Game', 'Fantasy', 'Có sẵn hôm nay'].map((x, i) => (
            <button
              key={x}
              type="button"
              className={`border-2 border-[#24150e] px-5 py-2 text-sm font-extrabold shadow-[3px_4px_0_#24150e] transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                i === 0
                  ? 'bg-[#ffe75c] text-[#24150e]'
                  : 'bg-white text-[#24150e] hover:bg-[#ffe75c]/60'
              }`}
            >
              {x}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {products.length ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border-2 border-dashed border-[#24150e] bg-white p-12 text-center shadow-[4px_5px_0_#24150e]">
            <h2 className="display text-3xl font-extrabold text-[#24150e]">Kho đồ đang nghỉ một chút</h2>
            <p className="mt-2 text-sm text-[#624b40]">Hãy quay lại sau hoặc liên hệ fanpage để được tư vấn các set đồ mới nhất nhé!</p>
          </div>
        )}
      </div>
    </main>
  );
}
