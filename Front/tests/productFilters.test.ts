import { describe, expect, it } from 'vitest';
import { filterProducts } from '../src/productFilters';
import type { Product } from '../src/api';

const products: Product[] = [
  { id: 1, name: 'Precision Gear', sku: 'GEAR-001', price: 25, erpCategory: 'Mechanical', status: 'DRAFT' },
  { id: 2, name: 'Gear Sensor', sku: 'SENS-002', price: 20, erpCategory: 'Electronics', status: 'SYNCED' },
  { id: 3, name: 'Bracket 100%', sku: 'PART_003', price: 5, erpCategory: '', status: 'FAILED' },
];

describe('product search and status filtering', () => {
  it('matches names and SKUs case-insensitively with trimmed partial queries', () => {
    expect(filterProducts(products, ' gEaR ', 'ALL').map(p => p.id)).toEqual([1, 2]);
    expect(filterProducts(products, 'sens-0', 'ALL').map(p => p.id)).toEqual([2]);
  });
  it.each(['DRAFT', 'SYNCED', 'FAILED'] as const)('filters %s independently', status => {
    expect(filterProducts(products, '', status)).toEqual(products.filter(p => p.status === status));
  });
  it('combines the name-or-SKU match with status using AND', () => {
    expect(filterProducts(products, 'gear', 'SYNCED').map(p => p.id)).toEqual([2]);
    expect(filterProducts(products, 'sens', 'DRAFT')).toEqual([]);
  });
  it('supports empty/whitespace queries, no matches, and empty data', () => {
    expect(filterProducts(products, '   ', 'ALL')).toEqual(products);
    expect(filterProducts(products, 'absent', 'ALL')).toEqual([]);
    expect(filterProducts([], '', 'ALL')).toEqual([]);
  });
  it('treats search characters literally and does not mutate the source', () => {
    const before = structuredClone(products);
    expect(filterProducts(products, '%', 'ALL').map(p => p.id)).toEqual([3]);
    expect(filterProducts(products, '_', 'ALL').map(p => p.id)).toEqual([3]);
    expect(filterProducts(products, '.*', 'ALL')).toEqual([]);
    expect(products).toEqual(before);
  });
});
