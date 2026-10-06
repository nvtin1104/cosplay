'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { AdminButton, AdminInput, AdminSelect, AdminTextarea } from './AdminUI';
import { formatRentalDate, formatVnd, orderStatusLabel, paymentStatusLabels, paymentTypeLabels, processingStatusLabels, rentalOrderStatuses } from '../../lib/rental-status';

type RentalDetailData = {
  id: string; customerName: string; customerEmail?: string; customerPhone?: string; customerId?: string | null; facebookUrl?: string;
  startDate: string; endDate: string; orderStatus: string; status: string; processingStatus: string; deposit: number; totalAmount: number; note?: string;
  items: { id: string; productTitle?: string; productSlug?: string; thumbnailUrl?: string; variantName?: string; quantity: number; price: number }[];
  paymentSummary: { depositPaid: number; balancePaid: number; depositRefunded: number; paymentStatus: string };
  payments: { id: string; type: string; amount: number; note?: string; actorName: string; createdAt: string }[];
  statusHistory: { id: string; fromStatus?: string; toStatus: string; fromProcessingStatus?: string; toProcessingStatus: string; actorName: string; createdAt: string }[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể hoàn tất thao tác.');
  return data as T;
}

export function RentalDetail({ id }: { id: string }) {
  const [rental, setRental] = useState<RentalDetailData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [paymentType, setPaymentType] = useState('DEPOSIT');

  async function load() {
    try { setRental(await api<RentalDetailData>(`/rentals/${id}`)); setError(''); }
    catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { void load(); }, [id]);

  async function changeStatus(orderStatus: string) {
    if (!rental) return;
    setBusy(true);
    try { await api(`/rentals/${id}`, { method: 'PATCH', body: JSON.stringify({ orderStatus }) }); await load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function addPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    setBusy(true);
    try {
      await api(`/rentals/${id}/payments`, { method: 'POST', body: JSON.stringify({ type: paymentType, amount: Number(form.get('amount')), note: form.get('note') }) });
      formElement.reset(); await load();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  if (!rental) return <div className="p-5 md:p-8">{error ? <p className="text-sm text-red-700">{error}</p> : <p className="text-sm text-neutral-500">Đang tải chi tiết đơn thuê…</p>}</div>;

  return <div className="min-w-0 p-4 md:p-8">
    <Link href="/admin/rentals" className="text-sm font-semibold text-neutral-500 hover:text-neutral-900">← Danh sách lịch thuê</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-wider text-neutral-400">CHI TIẾT ĐƠN THUÊ</p><h1 className="mt-1 text-2xl font-bold">{rental.customerName}</h1><p className="mt-1 text-sm text-neutral-500">#{rental.id.slice(0, 8)} · {formatRentalDate(rental.startDate)} – {formatRentalDate(rental.endDate)}</p></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-3"><p className="text-[11px] text-neutral-500">Trạng thái đơn</p><AdminSelect ariaLabel="Trạng thái đơn thuê" value={rental.orderStatus} disabled={busy || ['RETURNED', 'CANCELLED'].includes(rental.orderStatus)} searchable={false} allowEmpty={false} options={rentalOrderStatuses.map(({ value, label }) => ({ value, label }))} onChange={value => void changeStatus(value)} /></div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3"><p className="text-[11px] text-neutral-500">Trạng thái xử lý</p><strong className="mt-2 block text-sm">{processingStatusLabels[rental.processingStatus] || rental.processingStatus}</strong></div>
      </div>
    </div>
    {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-xl border border-neutral-200 bg-white p-4 md:p-5">
        <h2 className="font-bold">Thông tin khách thuê</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>Email: {rental.customerEmail || '—'}</p><p>Điện thoại: {rental.customerPhone || '—'}</p>
          {rental.facebookUrl && <p><a className="text-blue-700 hover:underline" target="_blank" rel="noreferrer" href={rental.facebookUrl}>Mở Facebook ↗</a></p>}
          {rental.customerId && <p><Link className="font-semibold text-amber-800 hover:underline" href={`/admin/customers/${rental.customerId}`}>Hồ sơ khách và lịch sử thuê →</Link></p>}
        </div>
        <h2 className="mt-6 font-bold">Sản phẩm thuê</h2>
        <div className="mt-3 divide-y divide-neutral-100">
          {rental.items.map(item => <div key={item.id} className="flex items-center gap-3 py-3">
            {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-14 w-12 rounded-md object-cover" /> : <div className="h-14 w-12 rounded-md bg-neutral-100" />}
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.productTitle || 'Sản phẩm đã lưu trữ'}</p><p className="text-xs text-neutral-500">{item.variantName ? `${item.variantName} · ` : ''}{item.quantity} sản phẩm</p></div>
            <p className="whitespace-nowrap text-sm font-semibold">{formatVnd(Number(item.price) * Number(item.quantity))}</p>
          </div>)}
          {rental.items.length === 0 && <p className="py-3 text-sm text-neutral-500">Đơn chưa có sản phẩm chi tiết.</p>}
        </div>
        {rental.note && <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm"><strong>Ghi chú:</strong> {rental.note}</div>}
      </section>

      <section className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 md:p-5">
          <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">Thanh toán</h2><p className="mt-1 text-sm font-semibold text-amber-800">{paymentStatusLabels[rental.paymentSummary.paymentStatus] || rental.paymentSummary.paymentStatus}</p></div><p className="text-right text-sm font-bold">{formatVnd(rental.totalAmount)}<span className="block text-xs font-normal text-neutral-500">Cọc cần nhận {formatVnd(rental.deposit)}</span></p></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs"><p>Đã cọc<strong className="mt-1 block">{formatVnd(rental.paymentSummary.depositPaid)}</strong></p><p>Đã thu<strong className="mt-1 block">{formatVnd(rental.paymentSummary.balancePaid)}</strong></p><p>Đã hoàn<strong className="mt-1 block">{formatVnd(rental.paymentSummary.depositRefunded)}</strong></p></div>
          <form onSubmit={addPayment} className="mt-4 grid gap-2 border-t border-neutral-100 pt-4">
            <AdminSelect ariaLabel="Loại giao dịch" value={paymentType} onChange={setPaymentType} searchable={false} allowEmpty={false} options={Object.entries(paymentTypeLabels).map(([value, label]) => ({ value, label }))} />
            <AdminInput name="amount" aria-label="Số tiền giao dịch" type="number" min="1" step="1" required placeholder="Số tiền (đồng)" />
            <AdminTextarea name="note" aria-label="Ghi chú giao dịch" rows={2} placeholder="Ghi chú (không bắt buộc)" />
            <AdminButton disabled={busy} className="py-2">Ghi nhận thanh toán</AdminButton>
          </form>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 md:p-5"><h2 className="font-bold">Lịch sử thanh toán</h2><div className="mt-3 space-y-3">
          {rental.payments.map(payment => <div key={payment.id} className="border-l-2 border-amber-400 pl-3"><p className="text-sm font-semibold">{paymentTypeLabels[payment.type] || payment.type} · {formatVnd(payment.amount)}</p><p className="text-xs text-neutral-500">{payment.actorName} · {formatRentalDate(payment.createdAt)}{payment.note ? ` · ${payment.note}` : ''}</p></div>)}
          {rental.payments.length === 0 && <p className="text-sm text-neutral-500">Chưa có giao dịch.</p>}
        </div></div>
      </section>
    </div>

    <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 md:p-5"><h2 className="font-bold">Lịch sử trạng thái</h2><div className="mt-3 grid gap-3 md:grid-cols-2">
      {rental.statusHistory.map(entry => <div key={entry.id} className="rounded-lg bg-neutral-50 p-3"><p className="text-sm font-semibold">{entry.fromStatus && entry.fromStatus !== entry.toStatus ? `${orderStatusLabel(entry.fromStatus)} → ` : ''}{orderStatusLabel(entry.toStatus)}</p><p className="mt-1 text-xs text-neutral-500">{entry.fromProcessingStatus && entry.fromProcessingStatus !== entry.toProcessingStatus ? `${processingStatusLabels[entry.fromProcessingStatus]} → ` : ''}{processingStatusLabels[entry.toProcessingStatus]} · {entry.actorName} · {formatRentalDate(entry.createdAt)}</p></div>)}
      {rental.statusHistory.length === 0 && <p className="text-sm text-neutral-500">Chưa có lịch sử trạng thái.</p>}
    </div></section>
  </div>;
}
