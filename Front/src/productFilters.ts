import type { Product, ProductStatus } from './api';

export type StatusFilter = 'ALL' | ProductStatus;

export function filterProducts(products: Product[], query: string, status: StatusFilter): Product[] {
  const term = query.trim().toLowerCase();
  return products.filter(product =>
    (status === 'ALL' || product.status === status) &&
    (product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term)),
  );
}
