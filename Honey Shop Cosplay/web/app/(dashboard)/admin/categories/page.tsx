import { CategoryManager } from '../../../../components/admin/CategoryTagManager';

// Dynamic server component to ensure fresh load
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Quản lý Cây danh mục | Honey Admin',
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Danh mục sản phẩm</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">Quản lý cây danh mục</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm">
            Phân loại trang phục và phụ kiện cosplay theo các tầng cấp bậc (Tầng 1: Gốc, Tầng 2: Nhóm/Series, Tầng 3+: Chi tiết). Mã Key (Slug) dùng làm định danh lọc URL trên trang người dùng.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <CategoryManager />
      </div>
    </div>
  );
}
