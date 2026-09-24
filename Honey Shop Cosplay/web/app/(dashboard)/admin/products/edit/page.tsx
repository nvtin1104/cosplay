import { Suspense } from 'react';
import { ProductEditClient } from '../../../../../components/admin/ProductEditClient';

export const metadata = {
  title: 'Sửa sản phẩm | Honey Admin',
};

export default function EditProductPage() {
  return (
    <div className="p-5 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-neutral-400">CATALOG / CHỈNH SỬA</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Sửa sản phẩm</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Cập nhật thông tin trang phục, giá thuê và tồn kho.
        </p>
      </div>

      <Suspense fallback={null}>
        <ProductEditClient />
      </Suspense>
    </div>
  );
}
