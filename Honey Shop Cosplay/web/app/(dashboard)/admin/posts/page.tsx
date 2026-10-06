import { ContentManager } from '../../../../components/admin/ContentManager';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export default function PostsPage() {
  return (
    <div className="min-w-0">
      <AdminListPageHeader title="Bài viết" description="Quản lý và xuất bản nội dung." />
      <ContentManager type="ARTICLE" />
    </div>
  );
}

