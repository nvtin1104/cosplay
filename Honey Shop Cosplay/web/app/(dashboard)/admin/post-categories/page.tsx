import { PostCategoryManager } from '../../../../components/admin/PostCategoryManager';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export default function PostCategoriesPage() {
  return (
    <div className="min-w-0">
      <AdminListPageHeader title="Danh mục nội dung" description="Nhóm bài viết và hướng dẫn theo chủ đề." />
      <PostCategoryManager />
    </div>
  );
}
