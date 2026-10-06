import { DashboardData } from '../../../components/admin/AdminData';

export default function DashboardPage() {
  return (
    <div className="p-3 sm:p-4 lg:p-5">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Honey Shop · Admin</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">Tổng quan thuê đồ</h1>
        </div>
      </header>
      <div>
        <DashboardData />
      </div>
    </div>
  );
}
