import { ContentManager } from '../../../../components/admin/ContentManager';

export default function GuidesAdminPage() {
  return <div className="p-3 sm:p-4 lg:p-5"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-amber-700">Thư viện nội dung</p><h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">Hướng dẫn</h1><p className="mt-1 text-xs text-neutral-500 sm:text-sm">Tạo các bước giúp khách thuê đồ dễ dàng hơn.</p><div className="mt-4"><ContentManager type="GUIDE" /></div></div>;
}
