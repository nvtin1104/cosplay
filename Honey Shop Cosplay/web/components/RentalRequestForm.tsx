'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useCustomerAuth } from './CustomerAuth';

type PriceKey = 'test' | 'fes' | 'shoot';
export function RentalRequestForm({ productSlug, prices }: { productSlug: string; prices: Record<PriceKey, number> }) {
  const { customer, openLogin } = useCustomerAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [priceType, setPriceType] = useState<PriceKey>('fes');
  const [notice, setNotice] = useState(''); const [success, setSuccess] = useState(false); const [busy, setBusy] = useState(false); const [unlocked, setUnlocked] = useState(false);

  function continueAfterLogin() { setUnlocked(true); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer?.contactReady) { openLogin(continueAfterLogin); return; }
    setBusy(true); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/v1/rental-requests', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productSlug, priceType, startDate: form.get('startDate'), endDate: form.get('endDate'), note: form.get('note') }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể gửi yêu cầu.');
      setSuccess(true); setNotice('Đã gửi yêu cầu thuê. Honey sẽ liên hệ để xác nhận lịch.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể gửi yêu cầu thuê.'); }
    finally { setBusy(false); }
  }

  const canEnterDetails = !!customer?.contactReady || unlocked;
  return <details className="mt-5 rounded-2xl border-2 border-[#24150e] bg-white p-5 shadow-[4px_5px_0_#24150e]"><summary className="cursor-pointer list-none font-extrabold text-[#24150e] [&::-webkit-details-marker]:hidden">Đăng ký thuê sản phẩm này <span className="float-right text-[#b4570a]">＋</span></summary>{success ? <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-[#624b40]">{notice} Honey sẽ liên hệ bạn theo thông tin đã lưu.</div> : !canEnterDetails ? <div className="mt-4 rounded-xl bg-amber-50 p-4"><p className="text-sm leading-6 text-[#624b40]">Đăng nhập Google và lưu link Facebook hoặc số điện thoại để tiếp tục đặt thuê.</p><button type="button" onClick={() => openLogin(continueAfterLogin)} className="mt-3 border-2 border-[#24150e] bg-[#ff9b35] px-4 py-2.5 font-extrabold text-white shadow-[3px_4px_0_#24150e]">Đăng nhập để tiếp tục</button></div> : <form ref={formRef} onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
    <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-[#624b40] sm:col-span-2">Honey sẽ liên hệ qua {customer?.phone ? `số ${customer.phone}` : 'Facebook'}{customer?.facebookUrl && customer.phone ? ` hoặc Facebook (${customer.facebookUrl})` : customer?.facebookUrl ? ` (${customer.facebookUrl})` : ''}.</p>
    <label className="grid gap-1 text-xs font-bold">Ngày nhận đồ<input name="startDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold">Ngày trả đồ<input name="endDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Gói thuê<select value={priceType} onChange={event => setPriceType(event.target.value as PriceKey)} className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm font-normal"><option value="test">Test đồ · {prices.test.toLocaleString('vi-VN')}đ</option><option value="fes">Fes · {prices.fes.toLocaleString('vi-VN')}đ</option><option value="shoot">Shoot ảnh · {prices.shoot.toLocaleString('vi-VN')}đ</option></select></label>
    <label className="grid gap-1 text-xs font-bold sm:col-span-2">Ghi chú<textarea name="note" maxLength={1000} className="min-h-20 w-full resize-y rounded-lg border border-neutral-300 p-3 text-sm font-normal" placeholder="Thời gian dự kiến hoặc câu hỏi cho shop" /></label>
    {notice && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{notice}</p>}
    <button disabled={busy} className="border-2 border-[#24150e] bg-[#ff9b35] px-4 py-3 font-extrabold text-white shadow-[3px_4px_0_#24150e] disabled:opacity-60 sm:col-span-2">{busy ? 'Đang gửi…' : 'Gửi yêu cầu thuê'}</button>
  </form>}</details>;
}
