'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, MessageCircleHeart } from 'lucide-react';
import { useCustomerAuth } from './CustomerAuth';

type Feedback = { id: string; customerName: string; content: string; imageUrl?: string | null; hideIdentity: boolean; createdAt: string };
type EligibleRental = { id: string; startDate: string; endDate: string };

export function ProductFeedback({ slug }: { slug: string }) {
  const { customer, openLogin } = useCustomerAuth();
  const [items, setItems] = useState<Feedback[]>([]);
  const [rentals, setRentals] = useState<EligibleRental[]>([]);
  const [rentalId, setRentalId] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [hideIdentity, setHideIdentity] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEligibleRentals = useCallback(async () => {
    if (!customer?.contactReady) { setRentals([]); setRentalId(''); return; }
    try {
      const response = await fetch(`/api/v1/customers/eligible-feedback/${encodeURIComponent(slug)}`, { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể kiểm tra lịch sử thuê.');
      setRentals(data); setRentalId(current => data.some((r: EligibleRental) => r.id === current) ? current : data[0]?.id || '');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể kiểm tra lịch sử thuê.'); }
  }, [customer, slug]);

  useEffect(() => {
    fetch(`/api/v1/products/${encodeURIComponent(slug)}/feedback`, { cache: 'no-store' })
      .then(async response => { if (response.ok) setItems(await response.json()); })
      .catch(() => {});
  }, [slug]);
  useEffect(() => { void loadEligibleRentals(); }, [loadEligibleRentals]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!customer?.contactReady) { openLogin(() => void loadEligibleRentals()); return; }
    if (!rentalId) { setNotice('Chỉ khách đã hoàn tất thuê sản phẩm này mới được gửi feedback.'); return; }
    setSaving(true); setNotice('');
    try {
      const response = await fetch(`/api/v1/products/${encodeURIComponent(slug)}/feedback`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rentalId, content, imageUrl, hideIdentity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không gửi được feedback.');
      setContent(''); setImageUrl(''); setHideIdentity(false);
      setNotice('Đã gửi feedback. Nội dung sẽ hiển thị sau khi shop duyệt.');
      await loadEligibleRentals();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không gửi được feedback.'); }
    finally { setSaving(false); }
  }

  const hasEligibility = !!customer?.contactReady && rentals.length > 0;
  return <section className="mt-16 border-t-2 border-dashed border-[#24150e]/30 pt-10" id="feedback">
    <div className="flex items-center gap-3"><MessageCircleHeart size={24} className="text-[#f07d24]" /><div><h2 className="display text-3xl font-extrabold text-[#24150e]">Feedback khách thuê</h2><p className="mt-1 text-sm text-[#624b40]">Chia sẻ trải nghiệm sau khi hoàn tất thuê set đồ này.</p></div></div>
    {items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{items.map(item => <article key={item.id} className="sticker overflow-hidden bg-white p-5"><p className="whitespace-pre-wrap leading-7 text-[#624b40]">“{item.content}”</p>{item.imageUrl && <img src={item.imageUrl} alt="Ảnh feedback khách thuê" className="mt-4 max-h-72 w-full rounded-xl border-2 border-[#24150e] object-cover" />}<div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-[#24150e]/20 pt-3 text-xs font-bold text-[#24150e]"><span>{item.customerName}</span><time>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</time></div></article>)}</div> : <p className="mt-5 rounded-xl border border-dashed border-[#24150e]/30 bg-white/60 p-5 text-sm text-[#624b40]">Chưa có feedback được duyệt cho sản phẩm này.</p>}
    {!customer?.contactReady ? <div className="mt-7 rounded-2xl border-2 border-[#24150e] bg-white p-5 shadow-[5px_6px_0_#24150e]"><p className="text-sm leading-6 text-[#624b40]">Đăng nhập Google và bổ sung link Facebook hoặc số điện thoại. Feedback chỉ dành cho khách đã hoàn tất thuê sản phẩm này.</p><button type="button" onClick={() => openLogin(() => void loadEligibleRentals())} className="mt-4 border-2 border-[#24150e] bg-[#ff9b35] px-5 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e]">Đăng nhập để kiểm tra lịch sử thuê</button></div> : hasEligibility ? <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border-2 border-[#24150e] bg-white p-5 shadow-[5px_6px_0_#24150e] sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e] sm:col-span-2">Đơn thuê đã hoàn tất<select required value={rentalId} onChange={event => setRentalId(event.target.value)} className="min-h-12 rounded-xl border border-neutral-300 bg-white px-3 font-normal">{rentals.map(rental => <option key={rental.id} value={rental.id}>{new Date(rental.startDate).toLocaleDateString('vi-VN')} – {new Date(rental.endDate).toLocaleDateString('vi-VN')}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e] sm:col-span-2">Chia sẻ trải nghiệm<textarea required minLength={5} maxLength={2000} value={content} onChange={event => setContent(event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-neutral-300 p-3 font-normal outline-none focus:border-[#f07d24]" placeholder="Bạn thích điều gì ở set đồ?" /></label>
      <label className="grid gap-1.5 text-sm font-bold text-[#24150e] sm:col-span-2"><span className="inline-flex items-center gap-2"><ImagePlus size={16} /> Link ảnh feedback (không bắt buộc)</span><input type="url" value={imageUrl} onChange={event => setImageUrl(event.target.value)} className="min-h-12 w-full rounded-xl border border-neutral-300 px-3 font-normal outline-none focus:border-[#f07d24]" placeholder="https://..." /></label>
      <label className="flex items-center gap-2 text-sm text-[#624b40] sm:col-span-2"><input type="checkbox" checked={hideIdentity} onChange={event => setHideIdentity(event.target.checked)} className="h-4 w-4 accent-[#f07d24]" />Ẩn tên của tôi trên feedback công khai</label>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">{notice && <p role="status" className="text-sm text-[#624b40]">{notice}</p>}<button disabled={saving} className="ml-auto border-2 border-[#24150e] bg-[#ff9b35] px-5 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e] disabled:opacity-60">{saving ? 'Đang gửi…' : 'Gửi feedback'}</button></div>
    </form> : <p role="status" className="mt-7 rounded-xl border border-dashed border-[#24150e]/30 bg-white/60 p-5 text-sm leading-6 text-[#624b40]">{notice || 'Chưa tìm thấy đơn thuê đã hoàn tất của sản phẩm này cho tài khoản Google đang đăng nhập. Feedback sẽ mở sau khi đơn được shop đánh dấu hoàn tất.'}</p>}
  </section>;
}
