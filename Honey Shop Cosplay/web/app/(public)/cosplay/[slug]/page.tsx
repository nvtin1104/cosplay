import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { getProduct } from '../../../../lib/api';

const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product
    ? { title: `${product.title} · Kho đồ Honey`, description: product.description }
    : { title: 'Không tìm thấy sản phẩm' };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const image =
    product.thumbnailUrl || product.images?.[0]?.url || '/assets/production/34.png';

  return (
    <main className="min-h-screen bg-[#fff6dc] py-12">
      <div className="shell">
        <Link
          href="/cosplay"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#24150e] hover:text-[#f07d24] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Về kho đồ cosplay</span>
        </Link>

        <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Cột ảnh sản phẩm vuông vức / sticker */}
          <div className="sticker relative aspect-[4/5] rotate-[-1deg] overflow-hidden border-[3px] border-[#24150e] bg-[#ffe75c] p-3 shadow-[10px_12px_0_#24150e]">
            <div className="relative h-full w-full overflow-hidden bg-white">
              <Image
                src={image}
                alt={product.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          {/* Cột thông tin chi tiết */}
          <div className="py-2">
            <span className="inline-block border-2 border-[#24150e] bg-[#ffe75c] px-4 py-1.5 text-xs font-extrabold text-[#24150e] shadow-[3px_4px_0_#24150e]">
              {product.status === 'AVAILABLE' ? 'CÓ SẴN TẠI SHOP' : 'LIÊN HỆ KIỂM TRA LỊCH'}
            </span>

            <h1 className="display mt-4 text-5xl font-extrabold leading-[.95] text-[#24150e] md:text-6xl">
              {product.title}
            </h1>

            <p className="mt-5 text-base leading-8 text-[#624b40] md:text-lg">
              {product.description || 'Trang phục cosplay được Honey chuẩn bị cẩn thận, giặt thơm sạch và kiểm tra đầy đủ phụ kiện trước khi giao khách.'}
            </p>

            {/* Bảng giá thuê các gói TEST / FES / SHOOT */}
            <div className="mt-8 grid grid-cols-3 overflow-hidden border-2 border-[#24150e] bg-white text-center shadow-[6px_7px_0_#24150e]">
              {[
                ['TEST', product.testPrice],
                ['FES', product.fesPrice],
                ['SHOOT', product.shootPrice],
              ].map(([label, value]) => (
                <div className="border-r-2 border-[#24150e] p-4 last:border-0" key={String(label)}>
                  <p className="text-xs font-extrabold text-[#ff9b35]">{label}</p>
                  <b className="display mt-1 block text-lg font-extrabold text-[#24150e]">
                    {money(Number(value))}
                  </b>
                </div>
              ))}
            </div>

            {/* Biến thể size */}
            {product.variants?.length ? (
              <div className="mt-8">
                <p className="font-extrabold text-[#24150e]">Size & biến thể:</p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <span
                      key={v.id}
                      className="border-2 border-[#24150e] bg-white px-4 py-2 text-sm font-extrabold text-[#24150e] shadow-[3px_4px_0_#24150e]"
                    >
                      {v.name} · {v.quantity} bộ
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Hộp lưu ý & Số lượng */}
            <div className="sticker mt-8 bg-[#ffe75c] p-5 text-[#24150e]">
              <b className="block text-base">
                Còn {product.totalQuantity} set sẵn sàng · {product.location || 'Tại shop TP.HCM'}
              </b>
              <p className="mt-1 text-sm text-[#472f23]">
                Giá thuê đã bao gồm trang phục và phụ kiện cơ bản đi kèm. Liên hệ shop để giữ lịch chính xác nhé!
              </p>
            </div>

            {/* Nút đặt thuê */}
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                className="sticker inline-flex items-center gap-2 rounded-full bg-[#ff9b35] px-8 py-4 font-extrabold text-white hover:bg-[#e88924] transition-all"
              >
                <span>Nhắn Honey giữ lịch</span>
                <ArrowUpRight size={18} />
              </a>
              <Link
                href="/huong-dan"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#24150e] bg-white px-6 py-4 font-extrabold text-[#24150e] hover:bg-[#ffe75c] transition-all"
              >
                <span>Xem quy định thuê</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
