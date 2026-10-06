import Link from 'next/link';
import { paymentStatusLabels, processingStatusLabels, rentalOrderStatuses } from '../../../lib/rental-status';
import type { DashboardRental } from './types';

function date(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

function Status({ children, tone = 'neutral' }: { children: string; tone?: 'amber' | 'neutral' }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold leading-4 ${tone === 'amber' ? 'bg-amber-100 text-amber-900' : 'bg-neutral-100 text-neutral-700'}`}>{children}</span>;
}

function RentalRow({ rental }: { rental: DashboardRental }) {
  const orderStatus = rental.orderStatus || rental.status || '';
  const orderLabel = rentalOrderStatuses.find(item => item.value === orderStatus)?.label || orderStatus;

  return (
    <article className="grid gap-3 px-4 py-3 transition-colors hover:bg-amber-50/40 sm:grid-cols-[minmax(140px,1fr)_minmax(170px,1.3fr)_minmax(150px,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-900">{rental.customerName}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-500" title={rental.productNames || ''}>{rental.productNames || 'Chưa có thông tin đồ thuê'}</p>
      </div>
      <p className="text-xs text-neutral-600 sm:text-sm">{date(rental.startDate)} – {date(rental.endDate)}</p>
      <div className="flex flex-wrap gap-1.5">
        <Status tone="amber">{orderLabel}</Status>
        <Status>{processingStatusLabels[rental.processingStatus || ''] || rental.processingStatus || 'Đang chờ'}</Status>
        {rental.paymentStatus && <Status>{paymentStatusLabels[rental.paymentStatus] || rental.paymentStatus}</Status>}
      </div>
      <Link href={`/admin/rentals/${rental.id}`} className="justify-self-start text-xs font-bold text-amber-800 hover:underline sm:justify-self-end">Mở đơn <span aria-hidden="true">→</span></Link>
    </article>
  );
}

export function RentalActionList({ rentals, totalCount }: { rentals: DashboardRental[]; totalCount: number }) {
  const activeRentals = rentals.filter(row => !['RETURNED', 'CANCELLED'].includes(row.orderStatus || row.status || ''));

  return (
    <section aria-labelledby="rental-action-heading" className="admin-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
        <div>
          <h2 id="rental-action-heading" className="text-sm font-bold sm:text-base">Đơn cần xử lý tình trạng đồ</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Theo dõi giao, nhận lại và kiểm tra đồ thuê</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">{totalCount > activeRentals.length ? `${activeRentals.length}/${totalCount} đơn` : `${totalCount} đơn`}</span>
      </header>
      {activeRentals.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-neutral-500">Hiện không có đơn nào cần xử lý.</p>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(140px,1fr)_minmax(170px,1.3fr)_minmax(150px,1fr)_auto] gap-3 bg-neutral-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500 sm:grid">
            <span>Khách và đồ thuê</span><span>Thời gian thuê</span><span>Trạng thái</span><span></span>
          </div>
          <div className="divide-y divide-neutral-100">{activeRentals.map(rental => <RentalRow key={rental.id} rental={rental} />)}</div>
        </>
      )}
    </section>
  );
}
