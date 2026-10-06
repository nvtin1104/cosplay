import { Suspense } from 'react';
import { ProductEditClient } from '../../../../../components/admin/ProductEditClient';

export const metadata = {
  title: 'Sửa sản phẩm | Honey Admin',
};

export default function EditProductPage() {
  return (
    <div className="p-3 sm:p-4 lg:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-400">Kho đồ · Chỉnh sửa</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">Sửa sản phẩm</h1>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Cập nhật thông tin trang phục, giá thuê và tồn kho.
        </p>
      </div>

      <Suspense fallback={null}>
        <ProductEditClient />
      </Suspense>
    </div>
  );
}
