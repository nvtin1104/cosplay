'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, MessageCircleHeart } from 'lucide-react';

type Feedback = { id: string; customerName: string; content: string; imageUrl?: string | null; hideIdentity: boolean; createdAt: string };

export function ProductFeedback({ slug }: { slug: string }) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hideIdentity, setHideIdentity] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/products/${encodeURIComponent(slug)}/feedback`, { cache: 'no-store' })
      .then(async (response) => { if (!response.ok) return; setItems(await response.json()); })
      .catch(() => {});
  }, [slug]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const response = await fetch(`/api/v1/products/${encodeURIComponent(slug)}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name, customerEmail: email, content, imageUrl, hideIdentity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không gửi được feedback.');
      setName(''); setEmail(''); setContent(''); setImageUrl(''); setHideIdentity(false);
      setNotice('Đã gửi feedback. Nội dung sẽ hiển thị sau khi shop duyệt.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không gửi được feedback.'); }
    finally { setSaving(false); }
  }

  return <section className="mt-16 border-t-2 border-dashed border-[#24150e]/30 pt-10" id="feedback">
    <div className="flex items-center gap-3"><MessageCircleHeart size={24} className="text-[#f07d24]" /><div><h2 className="display text-3xl font-extrabold text-[#24150e]">Feedback khách thuê</h2><p className="mt-1 text-sm text-[#624b40]">Chia sẻ ảnh và trải nghiệm của bạn với set đồ này.</p></div></div>
    {items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{items.map((item) => <article key={item.id} className="sticker overflow-hidden bg-white p-5"><p className="whitespace-pre-wrap leading-7 text-[#624b40]">“{item.content}”</p>{item.imageUrl && <img src={item.imageUrl} alt="Ảnh feedback khách thuê" className="mt-4 max-h-72 w-full rounded-xl border-2 border-[#24150e] object-cover" />}<div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-[#24150e]/20 pt-3 text-xs font-bold text-[#24150e]"><span>{item.customerName}</span><time>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</time></div></article>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-[#24150e]/30 bg-white/60 p-5 text-sm text-[#624b40]">Chưa có feedback cho sản phẩm này. Bạn có thể là người đầu tiên!</p>}
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border-2 border-[#24150e] bg-white p-5 shadow-[5px_6px_0_#24150e] sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e]">Tên hiển thị<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:border-[#f07d24]" placeholder="Tên của bạn" /></label>
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e]">Email (không bắt buộc)<input type="email" maxLength={160} value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:border-[#f07d24]" placeholder="email@example.com" /></label>
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e] sm:col-span-2">Chia sẻ trải nghiệm<textarea required minLength={5} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-neutral-300 p-3 font-normal outline-none focus:border-[#f07d24]" placeholder="Bạn thích điều gì ở set đồ?" /></label>
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e] sm:col-span-2"><span className="inline-flex items-center gap-2"><ImagePlus size={16} /> Link ảnh feedback (không bắt buộc)</span><input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} className="min-h-12 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:border-[#f07d24]" placeholder="https://..." /></label>
      <label className="flex items-center gap-2 text-sm text-[#624b40] sm:col-span-2"><input type="checkbox" checked={hideIdentity} onChange={(event) => setHideIdentity(event.target.checked)} className="h-4 w-4 accent-[#f07d24]" />Ẩn tên của tôi trên feedback công khai</label>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">{notice && <p role="status" className="text-sm text-[#624b40]">{notice}</p>}<button disabled={saving} className="ml-auto border-2 border-[#24150e] bg-[#ff9b35] px-5 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e] disabled:opacity-60">{saving ? 'Đang gửi…' : 'Gửi feedback'}</button></div>
    </form>
  </section>;
}
