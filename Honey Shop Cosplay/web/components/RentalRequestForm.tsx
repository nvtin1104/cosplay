'use client';

import { useState, type FormEvent } from 'react';

type PriceKey = 'test' | 'fes' | 'shoot';
export function RentalRequestForm({ productSlug, prices }: { productSlug: string; prices: Record<PriceKey, number> }) {
  const [priceType, setPriceType] = useState<PriceKey>('fes');
  const [notice, setNotice] = useState(''); const [success, setSuccess] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/v1/rental-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productSlug, priceType, customerName: form.get('name'), customerEmail: form.get('email'), customerPhone: form.get('phone'), startDate: form.get('startDate'), endDate: form.get('endDate'), note: form.get('note') }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể gửi yêu cầu.');
      setSuccess(true); setNotice('Đã gửi yêu cầu thuê. Honey sẽ liên hệ để xác nhận lịch.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể gửi yêu cầu thuê.'); }
    finally { setBusy(false); }
  }
  return <details className="mt-5 rounded-2xl border-2 border-[#24150e] bg-white p-5 shadow-[4px_5px_0_#24150e]"><summary className="cursor-pointer list-none font-extrabold text-[#24150e] [&::-webkit-details-marker]:hidden">Đăng ký thuê sản phẩm này <span className="float-right text-[#b4570a]">＋</span></summary>{success ? <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-[#624b40]">{notice} Honey sẽ liên hệ bạn theo thông tin đã gửi.{/* Close summary keeps confirmation visible. */}</div> : <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="grid gap-1 text-xs font-bold">Tên<input name="name" required maxLength={100} className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold">Số điện thoại<input name="phone" required maxLength={32} className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Email tài khoản<input name="email" type="email" required maxLength={160} className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /><span className="font-normal text-neutral-500">Dùng email này để xem lịch sử thuê trong tài khoản.</span></label>
    <label className="grid gap-1 text-xs font-bold">Ngày nhận đồ<input name="startDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold">Ngày trả đồ<input name="endDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Gói thuê<select value={priceType} onChange={event => setPriceType(event.target.value as PriceKey)} className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal"><option value="test">Test đồ · {prices.test.toLocaleString('vi-VN')}đ</option><option value="fes">Fes · {prices.fes.toLocaleString('vi-VN')}đ</option><option value="shoot">Shoot ảnh · {prices.shoot.toLocaleString('vi-VN')}đ</option></select></label>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Ghi chú<textarea name="note" maxLength={1000} className="min-h-20 w-full resize-y rounded-lg border border-neutral-300 p-3 text-sm font-normal" placeholder="Thời gian dự kiến hoặc câu hỏi cho shop" /></label>
    {notice && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{notice}</p>}
    <button disabled={busy} className="border-2 border-[#24150e] bg-[#ff9b35] px-4 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e] disabled:opacity-60 sm:col-span-2">{busy ? 'Đang gửi…' : 'Gửi yêu cầu thuê'}</button>
  </form>}</details>;
}
