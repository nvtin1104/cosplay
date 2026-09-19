import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Product } from '../lib/types';

const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const image =
    product.thumbnailUrl ||
    product.images?.[0]?.url ||
    `/assets/production/${[34, 30, 28][index % 3]}.png`;

  const isAvailable = product.status === 'AVAILABLE';

  return (
    <Link href={`/cosplay/${product.slug}`} className="group block">
      <article className="overflow-hidden rounded-3xl border-2 border-[#ebd7be] bg-white shadow-[0_6px_24px_rgba(245,135,0,0.06)] transition-all duration-300 group-hover:-translate-y-2 group-hover:border-[#f58700] group-hover:shadow-[0_12px_32px_rgba(245,135,0,0.15)]">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-[#fff6e8]">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Status Badge */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${
                isAvailable
                  ? 'bg-[#fff2d6] text-[#b85600] border border-[#ffd58a]'
                  : 'bg-[#fffae8] text-[#85531b] border border-[#fae5a8]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-[#f58700] animate-ping' : 'bg-[#eab308]'}`} />
              {isAvailable ? 'CÓ SẴN' : 'KIỂM TRA LỊCH'}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h3 className="display text-xl font-extrabold leading-tight text-[#382313] transition-colors group-hover:text-[#f57400]">
            {product.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#75553e]">
            {product.description || 'Set trang phục cosplay được Honey chuẩn bị kỹ lưỡng và giặt sạch thơm.'}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-[#f0ded0] pt-3.5">
            <div>
              <span className="text-[11px] font-semibold text-[#96745d] block uppercase tracking-wider">Giá thuê từ</span>
              <span className="display text-lg font-extrabold text-[#e06900]">
                {money(product.testPrice)}
              </span>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff4df] text-[#d96600] transition-transform group-hover:translate-x-1 group-hover:bg-[#f57400] group-hover:text-white">
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
