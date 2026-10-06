import Link from 'next/link';
import type { Product } from '../lib/types';
import { ProductThumbnail } from './ProductThumbnail';

export function ProductCard({ product }: { product: Product; index?: number; redeemEnabled?: boolean }) {
  return <Link href={`/cosplay/${product.slug}`} aria-label={`Xem ${product.title}`} className="group block transition duration-300 hover:-translate-y-1 hover:drop-shadow-xl">
    <ProductThumbnail product={product} />
  </Link>;
}
