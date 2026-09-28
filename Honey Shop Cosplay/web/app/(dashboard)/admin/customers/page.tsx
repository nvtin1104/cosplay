import { CustomerManager } from '../../../../components/admin/CustomerManager';

export default function CustomersPage() {
  return <div className="p-5 md:p-8"><p className="text-sm font-semibold uppercase tracking-[.16em] text-amber-700">Khách hàng</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Tài khoản khách</h1><p className="mt-2 text-sm text-neutral-500">Theo dõi hồ sơ, lịch thuê, điểm thành viên và trạng thái tài khoản.</p><div className="mt-7"><CustomerManager /></div></div>;
}
