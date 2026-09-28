'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Coins } from 'lucide-react';

export function PointsRedeemForm({ productSlug, pointsPrice }: { productSlug: string; pointsPrice: number }) {
  const [notice, setNotice] = useState(''); const [success, setSuccess] = useState(false); const [busy, setBusy] = useState(false);
  if (!pointsPrice) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/v1/customers/points/redeem', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productSlug, customerPhone: form.get('phone'), startDate: form.get('startDate'), endDate: form.get('endDate') }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Không thể đổi điểm.');
      setSuccess(true); setNotice(`Đã gửi yêu cầu đổi ${data.pointsUsed.toLocaleString('vi-VN')} điểm. Điểm được trừ tạm thời và hoàn lại nếu đơn bị hủy.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Đăng nhập tài khoản khách để đổi điểm.'); }
    finally { setBusy(false); }
  }
  return <details className="mt-4 rounded-2xl border-2 border-[#24150e] bg-[#ffe75c] p-5 shadow-[4px_5px_0_#24150e]"><summary className="flex cursor-pointer list-none items-center gap-2 font-extrabold text-[#24150e] [&::-webkit-details-marker]:hidden"><Coins size={19} /> Đổi set này bằng {pointsPrice.toLocaleString('vi-VN')} điểm <span className="ml-auto">＋</span></summary>{success ? <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-[#624b40]">{notice} <Link href="/tai-khoan" className="font-bold underline">Xem tài khoản</Link></p> : <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2"><p className="text-sm leading-6 text-[#624b40] sm:col-span-2">Đăng nhập tài khoản trước khi gửi yêu cầu. Điểm sẽ được hoàn nếu shop hủy đơn.</p><label className="grid gap-1 text-xs font-bold">Điện thoại<input name="phone" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label><label className="grid gap-1 text-xs font-bold">Ngày nhận<input name="startDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label><label className="grid gap-1 text-xs font-bold sm:col-span-2">Ngày trả<input name="endDate" type="date" required className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm font-normal" /></label>{notice && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{notice} {notice.includes('Đăng nhập') && <Link href="/tai-khoan" className="font-bold underline">Đăng nhập</Link>}</p>}<button disabled={busy} className="rounded-xl border-2 border-[#24150e] bg-white px-4 py-3 font-extrabold text-[#24150e] shadow-[3px_4px_0_#24150e] disabled:opacity-60 sm:col-span-2">{busy ? 'Đang gửi…' : 'Gửi yêu cầu đổi điểm'}</button></form>}</details>;
}
