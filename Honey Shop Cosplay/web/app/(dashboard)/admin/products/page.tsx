import { ProductManager } from '../../../../components/admin/AdminData';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export default function ProductsPage() {
  return (
    <div className="min-w-0">
      <AdminListPageHeader title="Kho đồ cosplay" description="Sản phẩm được cập nhật trực tiếp lên storefront." />
      <ProductManager />
    </div>
  );
}

