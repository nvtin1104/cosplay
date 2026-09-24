'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductCreateForm } from './ProductCreateForm';
import type { Product } from '../../lib/types';

export function ProductEditClient() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Thiếu mã sản phẩm.');
      return;
    }
    fetch(`/api/v1/products/id/${id}`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.message || 'Không tìm thấy sản phẩm.');
        setProduct(data);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/admin/products" prefetch={true} className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black">
          <ArrowLeft size={16} />
          Quay lại danh sách sản phẩm
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-card p-8 text-sm text-neutral-500 flex items-center gap-3">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
        Đang tải sản phẩm…
      </div>
    );
  }

  return <ProductCreateForm product={{ ...product, status: product.status as any }} />;
}
