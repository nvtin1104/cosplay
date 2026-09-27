import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { Sparkles } from 'lucide-react';
import { ProductCard } from '../../../components/ProductCard';
import { getCategories, getProducts, getTags } from '../../../lib/api';

export const metadata: Metadata = { title: 'Kho đồ cosplay', description: 'Xem các set cosplay và lọc theo danh mục, tag tại Honey Shop.' };
const pageSize = 24;
function href(category?: string, tag?: string, offset = 0) {
  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (tag) query.set('tag', tag);
  if (offset) query.set('offset', String(offset));
  return `/cosplay${query.size ? `?${query}` : ''}` as Route;
}
export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ category?: string; tag?: string; offset?: string }> }) {
  const params = await searchParams;
  const category = params.category || '';
  const tag = params.tag || '';
  const offset = Math.max(0, Number(params.offset) || 0);
  const [products, categories, tags] = await Promise.all([getProducts({ category, tag, limit: pageSize, offset }), getCategories(), getTags()]);
  return <main className="min-h-screen bg-[#fff6dc] py-14"><div className="shell">
    <p className="mb-4 inline-flex items-center gap-2 border-2 border-[#24150e] bg-[#ffe75c] px-4 py-1.5 text-xs font-extrabold shadow-[4px_5px_0_#24150e]"><Sparkles size={14} /> cosplay closet · sài gòn</p>
    <h1 className="display max-w-4xl text-5xl font-extrabold leading-[.9] text-[#24150e] md:text-8xl">Chọn một nhân vật. Viết một câu chuyện.</h1>
    <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#624b40] md:text-lg">Chọn danh mục và tag để tìm set đồ phù hợp.</p>
    <div className="mt-8 space-y-4"><div><h2 className="mb-2 text-sm font-extrabold">Danh mục</h2><div className="flex flex-wrap gap-2"><Link className={`border-2 border-[#24150e] px-4 py-2 text-sm font-bold ${!category ? 'bg-[#ffe75c]' : 'bg-white'}`} href={href('', tag)}>Tất cả</Link>{categories.map(cat => <Link key={cat.id} className={`border-2 border-[#24150e] px-4 py-2 text-sm font-bold ${category === cat.slug ? 'bg-[#ffe75c]' : 'bg-white'}`} href={href(cat.slug, tag)}>{cat.name}</Link>)}</div></div>
    <div><h2 className="mb-2 text-sm font-extrabold">Tag</h2><div className="flex flex-wrap gap-2"><Link className={`border-2 border-[#24150e] px-4 py-2 text-sm font-bold ${!tag ? 'bg-[#ffe75c]' : 'bg-white'}`} href={href(category, '')}>Tất cả</Link>{tags.map(item => <Link key={item.id} className={`border-2 border-[#24150e] px-4 py-2 text-sm font-bold ${tag === item.slug ? 'bg-[#ffe75c]' : 'bg-white'}`} href={href(category, item.slug)}>{item.name}</Link>)}</div></div></div>
    {products.length ? <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="mt-12 border-2 border-dashed border-[#24150e] bg-white p-12 text-center">Chưa có sản phẩm phù hợp với bộ lọc.</div>}
    <nav className="mt-10 flex justify-center gap-4 text-sm font-bold">{offset > 0 && <Link href={href(category, tag, Math.max(0, offset - pageSize))} className="border-2 border-[#24150e] bg-white px-4 py-2">← Trang trước</Link>}{products.length === pageSize && <Link href={href(category, tag, offset + pageSize)} className="border-2 border-[#24150e] bg-[#ffe75c] px-4 py-2">Trang sau →</Link>}</nav>
  </div></main>;
}
