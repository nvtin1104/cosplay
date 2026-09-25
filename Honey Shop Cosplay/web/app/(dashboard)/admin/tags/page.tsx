import { TagManager } from '../../../../components/admin/CategoryTagManager';

export const metadata = {
  title: 'Tag | Honey Admin',
};

export default function TagsPage() {
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">CATALOG</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Nhãn (Tags)</h1>
      <p className="mt-2 text-sm text-neutral-500">Quản lý danh sách tag dùng chung, ví dụ: Đồ mới, Sale, Hot.</p>
      <div className="mt-7">
        <TagManager />
      </div>
    </div>
  );
}
