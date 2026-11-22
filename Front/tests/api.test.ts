import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../src/api';

afterEach(() => vi.unstubAllGlobals());
it('sends DELETE and accepts a 204 with no JSON body', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  await expect(api.delete(7)).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith('/api/products/7', expect.objectContaining({ method: 'DELETE' }));
});
it('preserves the readable not-found error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 })));
  await expect(api.delete(7)).rejects.toThrow('Product not found');
});
it('reports connection failures without claiming deletion succeeded', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network failure')));
  await expect(api.delete(7)).rejects.toThrow('Cannot reach the backend');
});
