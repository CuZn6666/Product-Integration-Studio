import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import DeleteProductDialog from './DeleteProductDialog';
import { filterProducts, type StatusFilter } from './productFilters';
import { api, type Product, type SyncResult } from './api';
import ProductDialog from './ProductDialog';
import IntegrationFlow from './IntegrationFlow';
import './styles.css';

const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const statusLabel = { DRAFT: 'Draft', SYNCED: 'Synced', FAILED: 'Failed' };
const statusOptions = [{ label: 'All statuses', value: 'ALL' }, { label: 'Draft', value: 'DRAFT' }, { label: 'Synced', value: 'SYNCED' }, { label: 'Failed', value: 'FAILED' }];
const severity = { DRAFT: 'secondary', SYNCED: 'success', FAILED: 'danger' } as const;

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<{ product: Product; result: SyncResult | null; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState<{ product: Product | null } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const visibleProducts = filterProducts(products, query, statusFilter);
  const hasFilters = query.trim() !== '' || statusFilter !== 'ALL';
  const busy = loading || syncing !== null || deleteTarget !== null;

  function deleted(product: Product) {
    setProducts(current => current.filter(item => item.id !== product.id));
    if (lastSync?.product.id === product.id) setLastSync(null);
    setDeleteTarget(null); setError('');
    setNotice(`${product.name} deleted from the local database.`);
  }
  function clearFilters() { setQuery(''); setStatusFilter('ALL'); }

  async function load() {
    setLoading(true); setError('');
    try { setProducts(await api.list()); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to load products.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function sync(product: Product) {
    if (syncing !== null) return;
    setSyncing(product.id); setError(''); setNotice('');
    setLastSync({ product, result: null });
    try {
      const result = await api.sync(product.id);
      setProducts(current => current.map(item => item.id === product.id ? { ...item, status: result.status } : item));
      setLastSync({ product: { ...product, status: result.status }, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync could not finish. Please retry.';
      setError(message);
      setLastSync({ product, result: null, error: message });
    } finally { setSyncing(null); }
  }
  function saved(product: Product) {
    if (lastSync?.product.id === product.id) setLastSync(null);
    setProducts(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? product : item) : [...current, product]);
    setError('');
    setDialog(null); setNotice(`${product.name} saved as Draft.`);
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Product Integration Studio home"><span className="brand-icon"><i className="pi pi-sitemap" /></span><span>INTEGRATION <strong>STUDIO</strong></span></a>
      <span className="environment"><i className="pi pi-desktop" /> Local simulation</span></header>
    <main>
      <section className="page-heading"><div><p className="eyebrow">PRODUCT DATA OPERATIONS</p><h1>Product Integration Studio</h1><p className="subtitle">From engineering data to ERP-ready products.</p></div>
        <Button label="Add product" icon="pi pi-plus" onClick={() => setDialog({ product: null })} disabled={busy} /></section>
      <section className="metrics" aria-label="Product overview">
        <div><span className="metric-icon"><i className="pi pi-box" /></span><div><span className="metric-label">PLM products</span><strong>{products.length}</strong></div></div>
        <div><span className="metric-icon success"><i className="pi pi-check-circle" /></span><div><span className="metric-label">Synced to ERP</span><strong>{products.filter(p => p.status === 'SYNCED').length}</strong></div></div>
        <div><span className="metric-icon warning"><i className="pi pi-exclamation-circle" /></span><div><span className="metric-label">Missing mapping</span><strong>{products.filter(p => !p.erpCategory).length}</strong></div></div>
      </section>
      {error && <div className="notice error" role="alert"><span>{error}</span><Button label="Retry" size="small" outlined onClick={() => void load()} disabled={busy} /></div>}
      {notice && <div className="notice success" role="status"><i className="pi pi-check-circle" /><span>{notice}</span></div>}
      <IntegrationFlow product={lastSync?.product} result={lastSync?.result} busy={syncing !== null} error={lastSync?.error} />
      <section className="panel products-panel"><div className="panel-heading"><div><h2>Product workspace <span className="count">{products.length}</span></h2><p>Manage PLM records and prepare their ERP mapping.</p></div><Button label="Refresh" icon="pi pi-refresh" text size="small" onClick={() => void load()} disabled={busy} /></div>
        <div className="product-filters" role="search" aria-label="Find products">
          <div className="search-field"><label htmlFor="product-search">Search products</label>
            <InputText id="product-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or SKU" /></div>
          <div className="status-field"><label htmlFor="status-filter">Status</label>
            <select id="status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)}>{statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <Button label="Clear filters" icon="pi pi-filter-slash" text onClick={clearFilters} disabled={!query && statusFilter === 'ALL'} />
          <span className="result-count" role="status">{loading ? 'Loading products…' : `${visibleProducts.length} of ${products.length} products`}</span>
        </div>
        <DataTable value={visibleProducts} dataKey="id" loading={loading} emptyMessage={hasFilters ? 'No products match your search and status. Clear filters to see all products.' : error ? 'Products could not be loaded. Retry when the backend is available.' : 'No products yet. Add a product to get started.'} tableStyle={{ minWidth: '780px' }}>
          <Column field="name" header="Product" body={(p: Product) => <span className="product-name">{p.name}</span>} />
          <Column field="sku" header="SKU" body={(p: Product) => <code>{p.sku}</code>} />
          <Column field="price" header="Price" body={(p: Product) => money.format(p.price)} />
          <Column field="erpCategory" header="ERP category" body={(p: Product) => p.erpCategory || <span className="missing"><i className="pi pi-exclamation-triangle" /> Not mapped</span>} />
          <Column field="status" header="Status" body={(p: Product) => <Tag value={statusLabel[p.status]} severity={severity[p.status]} />} />
          <Column header="Actions" body={(p: Product) => <div className="row-actions"><Button icon="pi pi-pencil" text rounded aria-label={`Edit ${p.name}`} onClick={() => setDialog({ product: p })} disabled={busy} /><Button label="Sync to ERP" size="small" outlined onClick={() => void sync(p)} loading={syncing === p.id} disabled={busy} aria-label={`Sync ${p.name} to ERP`} /><Button icon="pi pi-trash" text rounded severity="danger" className="delete-button" aria-label={`Delete ${p.name}`} onClick={() => { setNotice(''); setDeleteTarget(p); }} disabled={busy} /></div>} />
        </DataTable>
        <div className="table-footer"><i className="pi pi-database" /> Changes are stored locally in H2.</div>
      </section>
      <footer className="page-footer"><span><i className="pi pi-shield" /> Simulation only · No external ERP requests</span><span>PLM → Validate & Map → ERP</span></footer>
    </main>
    {deleteTarget && <DeleteProductDialog product={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={deleted} />}
    {dialog && <ProductDialog product={dialog.product} onClose={() => setDialog(null)} onSaved={saved} />}
  </div>;
}
