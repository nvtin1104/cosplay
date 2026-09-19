import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../lib/types';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0]?.url ||
    `/assets/production/${[34, 30, 28][index % 3]}.png`;

  // 2 màu chính: Cam (#ff9b35) và Vàng (#ffe75c)
  const accents = ['bg-[#ff9b35] text-white', 'bg-[#ffe75c] text-[#24150e]'];

  return (
    <Link href={`/cosplay/${product.slug}`} className="group block">
      <article className="sticker cut-card overflow-hidden bg-white transition duration-300 group-hover:-translate-y-2 group-hover:rotate-[-1deg]">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#fff6dc]">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width:768px) 100vw,33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          {/* Badge trạng thái vuông vức dạng sticker */}
          <span
            className={`absolute left-4 top-4 border-2 border-[#24150e] px-3 py-1 text-xs font-extrabold shadow-[2px_3px_0_#24150e] ${
              accents[index % accents.length]
            }`}
          >
            {product.status === 'AVAILABLE' ? 'CÓ SẴN' : 'KIỂM TRA LỊCH'}
          </span>
        </div>
        <div className="p-5">
          <h3 className="display text-2xl font-extrabold leading-tight text-[#24150e]">
            {product.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#624b40]">
            {product.description || 'Một set cosplay được Honey chuẩn bị kỹ cho buổi chụp của bạn.'}
          </p>
          <div className="mt-5 flex items-center justify-between border-t border-dashed border-[#24150e]/30 pt-4 text-[#24150e]">
            <b>Từ {money(product.testPrice)}</b>
            <span className="font-extrabold text-[#f07d24] group-hover:underline">Xem set ↗</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
