import { ProductManager } from '../../../../components/admin/AdminData';
import { getProducts } from '../../../../lib/api';

export default async function ProductsPage() {
  const initialProducts = await getProducts();
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">CATALOG</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Kho đồ cosplay</h1>
      <p className="mt-2 text-sm text-neutral-500">Sản phẩm được cập nhật trực tiếp lên storefront.</p>
      <div className="mt-7">
        <ProductManager initialProducts={initialProducts} />
      </div>
    </div>
  );
}

