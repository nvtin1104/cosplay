import { ProductCreateForm } from '../../../../../components/admin/ProductCreateForm';

export const metadata = {
  title: 'Thêm sản phẩm mới | Honey Admin',
  description: 'Thêm mới trang phục cosplay, phụ kiện vào kho dữ liệu Honey Shop',
};

export default function NewProductPage() {
  return (
    <div className="p-3 sm:p-4 lg:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-400">Kho đồ · Tạo mới</p>
        <h1 className="mt-0.5 text-xl font-bold tracking-tight sm:text-2xl">Thêm sản phẩm mới</h1>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Nhập thông tin trang phục, định giá thuê và quản lý số lượng kho đồ.
        </p>
      </div>

      <ProductCreateForm />
    </div>
  );
}
