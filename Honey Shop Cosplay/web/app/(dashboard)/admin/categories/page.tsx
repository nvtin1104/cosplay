import { CategoryManager } from '../../../../components/admin/CategoryTagManager';

// Dynamic server component to ensure fresh load
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quản lý Cây danh mục | Honey Admin',
};

export default function CategoriesPage() {
  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider text-amber-600 uppercase">CATALOG & TAXONOMY</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-neutral-900">Quản lý Cây danh mục</h1>
          <p className="mt-1.5 text-sm text-neutral-500 max-w-2xl">
            Phân loại trang phục và phụ kiện cosplay theo các tầng cấp bậc (Tầng 1: Gốc, Tầng 2: Nhóm/Series, Tầng 3+: Chi tiết). Mã Key (Slug) dùng làm định danh lọc URL trên trang người dùng.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CategoryManager />
      </div>
    </div>
  );
}
