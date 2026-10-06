import Link from 'next/link';
import { formatVnd } from '../../../lib/rental-status';
import type { DashboardSummary } from './types';

type StatCardProps = { label: string; value: string | number; hint: React.ReactNode };

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <article className="admin-card flex min-h-[108px] flex-col justify-between p-3.5 sm:p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl" title={String(value)}>{value}</p>
      <div className="mt-1 text-[11px] leading-4 text-neutral-500">{hint}</div>
    </article>
  );
}

export function DashboardStats({ stats }: { stats: DashboardSummary }) {
  return (
    <section aria-label="Thống kê đơn thuê" className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
      <StatCard label="Tổng đơn thuê" value={Number(stats.totalOrders || 0)} hint={`${Number(stats.activeOrders || 0)} đơn đang xử lý`} />
      <StatCard label="Khách thuê" value={Number(stats.customerCount || 0)} hint={<Link href="/admin/customers" className="font-semibold text-amber-800 hover:underline">Xem danh sách khách</Link>} />
      <StatCard label="Đã thu ròng" value={formatVnd(Number(stats.amountCollected || 0))} hint="Đã trừ các khoản hoàn cọc" />
      <StatCard label="Còn phải thu" value={formatVnd(Number(stats.amountOutstanding || 0))} hint="Theo các đơn đã ghi nhận" />
    </section>
  );
}
