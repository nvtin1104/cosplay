import type { Metadata } from 'next';
import { ProductCard } from '../../../components/ProductCard';
import { getProducts } from '../../../lib/api';

export const metadata: Metadata = {
  title: 'Kho đồ cosplay',
  description: 'Xem các set cosplay anime, game có ảnh thật, giá thuê và tình trạng có sẵn tại Honey Shop.',
};

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-[#fffdfa] py-14">
      <div className="shell">
        <span className="inline-block rounded-full bg-[#fff5db] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#c25e00] border border-[#f5cb88]">
          ✦ Cosplay closet
        </span>
        <h1 className="display mt-3 max-w-4xl text-5xl font-extrabold leading-tight text-[#382313] md:text-7xl">
          Chọn một nhân vật. Viết một câu chuyện.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-[#73533c]">
          Tất cả các set cosplay đều có ảnh thật tại shop, được giặt sấy thơm tho và kèm đầy đủ phụ kiện.
        </p>

        {/* Filter categories */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {['Tất cả', 'Anime', 'Game', 'Fantasy', 'Có sẵn hôm nay'].map((x, i) => (
            <button
              key={x}
              type="button"
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all shadow-sm ${
                i === 0
                  ? 'bg-gradient-to-r from-[#ff9b28] to-[#f57400] text-white shadow-[0_4px_12px_rgba(245,116,0,0.25)]'
                  : 'border border-[#ebd7be] bg-white text-[#4e3422] hover:bg-[#fff7eb] hover:border-[#f58700]'
              }`}
            >
              {x}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {products.length ? (
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border-2 border-dashed border-[#ebd7be] bg-[#fffaf0] p-12 text-center">
            <span className="text-4xl">🍯</span>
            <h2 className="display mt-3 text-3xl font-bold text-[#382313]">Kho đồ đang được cập nhật</h2>
            <p className="mt-2 text-sm text-[#8c674b]">Hãy quay lại sau hoặc liên hệ shop để nhận catalogue chi tiết nhé!</p>
          </div>
        )}
      </div>
    </main>
  );
}
