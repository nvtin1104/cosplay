import { CategoryManager } from '../../../../components/admin/CategoryTagManager';

export const metadata = {
  title: 'Danh mục | Honey Admin',
};

export default function CategoriesPage() {
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">CATALOG</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Danh mục sản phẩm</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Xây dựng cây danh mục theo cấp bậc, ví dụ: Game &gt; Genshin Impact, Anime &gt; Naruto.
      </p>
      <div className="mt-7">
        <CategoryManager />
      </div>
    </div>
  );
}
