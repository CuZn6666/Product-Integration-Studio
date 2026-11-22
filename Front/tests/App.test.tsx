import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { api, type Product } from '../src/api';

vi.mock('../src/api', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/api')>();
  return { ...actual, api: { list: vi.fn(), delete: vi.fn(), sync: vi.fn(), create: vi.fn(), update: vi.fn() } };
});
// The real canvas is checked in the browser; jsdom cannot measure React Flow nodes.
vi.mock('../src/IntegrationFlow', () => ({ default: ({ product, result }: { product?: Product; result?: { message: string } }) =>
  <section aria-label="Integration flow">{product?.name ?? 'Ready to sync'} {result?.message}</section> }));
const products: Product[] = [
  { id: 1, name: 'Precision Gear', sku: 'GEAR-001', price: 25, erpCategory: 'Mechanical', status: 'DRAFT' },
  { id: 2, name: 'Gear Sensor', sku: 'SENS-002', price: 20, erpCategory: 'Electronics', status: 'SYNCED' },
  { id: 3, name: 'Bracket', sku: 'PART-003', price: 5, erpCategory: '', status: 'FAILED' },
];
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.list).mockResolvedValue(structuredClone(products));
  vi.mocked(api.delete).mockResolvedValue(undefined);
});
async function start() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('button', { name: 'Delete Precision Gear' });
  return user;
}
async function chooseStatus(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), label);
}

describe('workspace behavior', () => {
  it('combines search and status, distinguishes no matches, and clears filters', async () => {
    const user = await start();
    await user.type(screen.getByLabelText('Search products'), ' GeAr ');
    expect(screen.getByText('2 of 3 products')).toBeTruthy();
    await chooseStatus(user, 'Synced');
    expect(screen.getByText('1 of 3 products')).toBeTruthy();
    expect(within(screen.getByRole('table')).queryByText('Precision Gear')).toBeNull();
    await user.clear(screen.getByLabelText('Search products'));
    await user.type(screen.getByLabelText('Search products'), 'PART-003');
    expect(screen.getByText(/No products match/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('3 of 3 products')).toBeTruthy();
  });
  it('cancels deletion without any DELETE request', async () => {
    const user = await start();
    await user.click(screen.getByRole('button', { name: 'Delete Precision Gear' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete product?' });
    expect(within(dialog).getByText('GEAR-001')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete Precision Gear' })).toBeTruthy();
  });
  it('keeps the product on delete failure, prevents duplicate requests, then retries', async () => {
    let rejectDelete!: (reason: Error) => void;
    vi.mocked(api.delete).mockImplementationOnce(() => new Promise((_, reject) => { rejectDelete = reject; }));
    const user = await start();
    await user.click(screen.getByRole('button', { name: 'Delete Precision Gear' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete product' }));
    expect((within(dialog).getByRole('button', { name: 'Delete product' }) as HTMLButtonElement).disabled).toBe(true);
    expect((within(dialog).getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
    rejectDelete(new Error('Backend unavailable'));
    await screen.findByRole('alert');
    expect(within(screen.getByRole('table')).getByText('Precision Gear')).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Delete product' }));
    await waitFor(() => expect(within(screen.getByRole('table')).queryByText('Precision Gear')).toBeNull());
    expect(api.delete).toHaveBeenCalledTimes(2);
    expect(screen.getByText('2 of 2 products')).toBeTruthy();
  });
  it('reapplies status filters after sync and clears deleted product flow state', async () => {
    vi.mocked(api.sync).mockResolvedValue({ productId: 1, outcome: 'SUCCESS', status: 'SYNCED', message: 'Simulated export complete' });
    const user = await start();
    await chooseStatus(user, 'Draft');
    await user.click(screen.getByRole('button', { name: 'Sync Precision Gear to ERP' }));
    await screen.findByText(/No products match/);
    expect(within(screen.getByRole('region', { name: 'Integration flow' })).getByText(/Simulated export complete/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.click(screen.getByRole('button', { name: 'Delete Precision Gear' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete product' }));
    await screen.findByText('Precision Gear deleted from the local database.');
    expect(within(screen.getByRole('region', { name: 'Integration flow' })).getByText('Ready to sync')).toBeTruthy();
  });
  it('preserves filters on refresh and displays an actual empty database', async () => {
    const user = await start();
    await user.type(screen.getByLabelText('Search products'), 'sens');
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('1 of 3 products');
    expect((screen.getByLabelText('Search products') as HTMLInputElement).value).toBe('sens');
    vi.mocked(api.list).mockResolvedValue([]);
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('No products yet. Add a product to get started.');
  });
  it('creates and edits products while preserving the active search', async () => {
    const created: Product = { id: 4, name: 'New Motor', sku: 'MOTOR-004', price: 30, erpCategory: '', status: 'DRAFT' };
    vi.mocked(api.create).mockResolvedValue(created);
    vi.mocked(api.update).mockResolvedValue({ ...created, name: 'Updated Motor' });
    const user = await start();
    await user.type(screen.getByLabelText('Search products'), 'motor');
    await user.click(screen.getByRole('button', { name: 'Add product' }));
    await user.type(screen.getByLabelText(/Product name/), 'New Motor');
    await user.type(screen.getByLabelText(/SKU/), 'MOTOR-004');
    await user.type(screen.getByLabelText(/Price/), '30');
    await user.click(screen.getByRole('button', { name: 'Save product' }));
    await screen.findByText('New Motor saved as Draft.');
    expect(screen.getByText('1 of 4 products')).toBeTruthy();
    expect(api.create).toHaveBeenCalledWith({ name: 'New Motor', sku: 'MOTOR-004', price: 30, erpCategory: '' });
    await user.click(screen.getByRole('button', { name: 'Edit New Motor' }));
    await user.clear(screen.getByLabelText(/Product name/));
    await user.type(screen.getByLabelText(/Product name/), 'Updated Motor');
    await user.click(screen.getByRole('button', { name: 'Save product' }));
    await screen.findByText('Updated Motor saved as Draft.');
    expect(within(screen.getByRole('table')).getByText('Updated Motor')).toBeTruthy();
  });
  it('retains a business sync failure and updates its visible status', async () => {
    vi.mocked(api.sync).mockResolvedValue({ productId: 1, outcome: 'FAILURE', status: 'FAILED', message: 'ERP category is required' });
    const user = await start();
    await user.click(screen.getByRole('button', { name: 'Sync Precision Gear to ERP' }));
    await screen.findByText(/ERP category is required/);
    await chooseStatus(user, 'Failed');
    expect(screen.getByText('2 of 3 products')).toBeTruthy();
    expect(within(screen.getByRole('table')).getByText('Precision Gear')).toBeTruthy();
  });

});
