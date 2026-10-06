import { TagManager } from '../../../../components/admin/CategoryTagManager';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export const metadata = {
  title: 'Tag | Honey Admin',
};

export default function TagsPage() {
  return (
    <div className="min-w-0">
      <AdminListPageHeader title="Nhãn (Tags)" description="Quản lý tag dùng chung: Đồ mới, Sale, Hot." />
      <TagManager />
    </div>
  );
}
