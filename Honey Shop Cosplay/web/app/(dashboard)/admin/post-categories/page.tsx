import { PostCategoryManager } from '../../../../components/admin/PostCategoryManager';

export default function PostCategoriesPage() {
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-700">Thư viện nội dung</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Danh mục nội dung</h1>
      <p className="mt-2 text-sm text-neutral-500">Sắp xếp bài viết và hướng dẫn theo chủ đề.</p>
      <div className="mt-7"><PostCategoryManager /></div>
    </div>
  );
}
