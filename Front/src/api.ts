export type ProductStatus = 'DRAFT' | 'SYNCED' | 'FAILED';
export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  erpCategory: string;
  status: ProductStatus;
}
export interface SyncResult {
  productId: number;
  outcome: 'SUCCESS' | 'FAILURE';
  message: string;
  status: ProductStatus;
}
export type ProductInput = Omit<Product, 'id' | 'status'>;

export class ApiError extends Error {
  constructor(message: string, public fieldErrors: Record<string, string> = {}) {
    super(message);
  }
}

async function request<T>(path = '', method = 'GET', body?: ProductInput): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/products${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError('Cannot reach the backend. Check that it is running on port 8080, then retry.');
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message ?? (response.status >= 500 ? 'Backend unavailable. Check that it is running on port 8080, then retry.' : `Request failed (${response.status}). Please try again.`), data?.fieldErrors);
  }
  if (data === null) throw new ApiError('The backend returned an unreadable response. Please retry.');
  return data as T;
}

export const api = {
  list: () => request<Product[]>(),
  delete: (id: number) => request<void>(`/${id}`, 'DELETE'),
  sync: (id: number) => request<SyncResult>(`/${id}/sync`, 'POST'),
  create: (data: ProductInput) => request<Product>('', 'POST', data),
  update: (id: number, data: ProductInput) => request<Product>(`/${id}`, 'PUT', data),
};
