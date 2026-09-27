import { ContentManager } from '../../../../components/admin/ContentManager';

export default function GuidesAdminPage() {
  return <div className="p-5 md:p-8"><p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-700">Thư viện nội dung</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Hướng dẫn</h1><p className="mt-2 text-sm text-neutral-500">Tạo các bước và hướng dẫn giúp khách thuê đồ dễ dàng hơn.</p><div className="mt-7"><ContentManager type="GUIDE" /></div></div>;
}
