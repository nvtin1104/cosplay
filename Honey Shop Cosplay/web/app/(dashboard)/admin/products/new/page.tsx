import { ProductCreateForm } from '../../../../../components/admin/ProductCreateForm';

export const metadata = {
  title: 'Thêm sản phẩm mới | Honey Admin',
  description: 'Thêm mới trang phục cosplay, phụ kiện vào kho dữ liệu Honey Shop',
};

export default function NewProductPage() {
  return (
    <div className="p-5 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold text-neutral-400">CATALOG / TẠO MỚI</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Thêm sản phẩm mới</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Nhập thông tin trang phục, định giá thuê và quản lý số lượng kho đồ.
        </p>
      </div>

      <ProductCreateForm />
    </div>
  );
}
