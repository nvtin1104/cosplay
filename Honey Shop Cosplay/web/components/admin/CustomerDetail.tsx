'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatRentalDate, formatVnd, orderStatusLabel, paymentStatusLabels, processingStatusLabels } from '../../lib/rental-status';

type CustomerDetailData = {
  id: string; email: string; name: string; phone?: string | null; facebookUrl?: string | null; active: boolean; createdAt: string;
  rentals: { id: string; customerName: string; startDate: string; endDate: string; orderStatus: string; processingStatus: string; paymentStatus: string; deposit: number; totalAmount: number; note?: string }[];
};

export function CustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/v1/admin/customers/${id}`, { credentials: 'include' }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể tải hồ sơ khách.');
      return data as CustomerDetailData;
    }).then(setCustomer).catch(error => setError(error.message));
  }, [id]);

  if (!customer) return <div className="p-5 md:p-8">{error ? <p className="text-sm text-red-700">{error}</p> : <p className="text-sm text-neutral-500">Đang tải hồ sơ khách…</p>}</div>;
  return <div className="min-w-0 p-4 md:p-8">
    <Link href="/admin/customers" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900">← Danh sách khách hàng</Link>
    <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">HỒ SƠ KHÁCH HÀNG</p><h1 className="mt-1 text-2xl font-bold">{customer.name}</h1></div>
    <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-4 md:p-5"><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs text-neutral-500">Email</p><p className="mt-1 font-medium">{customer.email}</p></div>
      <div><p className="text-xs text-neutral-500">Điện thoại</p><p className="mt-1 font-medium">{customer.phone || '—'}</p></div>
      <div><p className="text-xs text-neutral-500">Trạng thái tài khoản</p><p className="mt-1 font-medium">{customer.active ? 'Hoạt động' : 'Đã khóa'}</p></div>
      <div><p className="text-xs text-neutral-500">Facebook</p>{customer.facebookUrl ? <a href={customer.facebookUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-blue-700 hover:underline">Mở hồ sơ ↗</a> : <p className="mt-1">—</p>}</div>
    </div></section>
    <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Lịch sử thuê</h2><span className="text-xs text-neutral-500">{customer.rentals.length} đơn</span></div>
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-neutral-50 text-[11px] uppercase text-neutral-500"><tr><th className="px-4 py-3">Đơn thuê</th><th className="px-4 py-3">Thời gian thuê</th><th className="px-4 py-3">Trạng thái đơn</th><th className="px-4 py-3">Xử lý</th><th className="px-4 py-3">Thanh toán</th><th className="px-4 py-3 text-right">Tổng tiền</th></tr></thead><tbody className="divide-y divide-neutral-100">
        {customer.rentals.map(rental => <tr key={rental.id}><td className="px-4 py-3"><Link href={`/admin/rentals/${rental.id}`} className="font-semibold text-amber-800 hover:underline">#{rental.id.slice(0, 8)} · Chi tiết</Link>{rental.note && <p className="mt-1 max-w-56 truncate text-xs text-neutral-500">{rental.note}</p>}</td><td className="whitespace-nowrap px-4 py-3 text-xs">{formatRentalDate(rental.startDate)} – {formatRentalDate(rental.endDate)}</td><td className="px-4 py-3">{orderStatusLabel(rental.orderStatus)}</td><td className="px-4 py-3">{processingStatusLabels[rental.processingStatus] || rental.processingStatus}</td><td className="px-4 py-3">{paymentStatusLabels[rental.paymentStatus] || rental.paymentStatus}</td><td className="px-4 py-3 text-right font-semibold">{formatVnd(rental.totalAmount)}</td></tr>)}
        {customer.rentals.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-neutral-500">Khách chưa có lịch sử thuê.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
