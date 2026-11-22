import { useState, type FormEvent } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { api, ApiError, type Product } from './api';

interface Props { product: Product | null; onClose: () => void; onSaved: (product: Product) => void }
export default function ProductDialog({ product, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [price, setPrice] = useState(product?.price.toFixed(2) ?? '');
  const [erpCategory, setCategory] = useState(product?.erpCategory ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setFields({});
    try {
      const data = { name: name.trim(), sku: sku.trim(), price: Number(price), erpCategory: erpCategory.trim() };
      const saved = product ? await api.update(product.id, data) : await api.create(data);
      onSaved(saved);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to save product.');
      if (error instanceof ApiError) setFields(error.fieldErrors);
    } finally { setSaving(false); }
  }
  const fieldError = (field: string) => fields[field] ? <small id={`${field}-error`} className="field-error">{fields[field]}</small> : null;
  return <Dialog header={product ? 'Edit product' : 'Add product'} visible modal onHide={() => { if (!saving) onClose(); }}
    className="product-dialog" draggable={false} closable={!saving} closeOnEscape={!saving}>
    <p className="dialog-intro">Save your PLM data. An ERP category is only required when syncing.</p>
    <form onSubmit={save}>
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="field"><label htmlFor="name">Product name <span>*</span></label>
        <InputText id="name" value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoFocus disabled={saving} invalid={!!fields.name} aria-describedby="name-error" />{fieldError('name')}</div>
      <div className="form-pair"><div className="field"><label htmlFor="sku">SKU <span>*</span></label>
        <InputText id="sku" value={sku} onChange={e => setSku(e.target.value)} required maxLength={64} disabled={saving} invalid={!!fields.sku} aria-describedby="sku-error" />{fieldError('sku')}</div>
      <div className="field"><label htmlFor="price">Price (EUR) <span>*</span></label>
        <InputText id="price" type="number" min="0" max="999999999999.99" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required disabled={saving} invalid={!!fields.price} aria-describedby="price-error" />{fieldError('price')}</div></div>
      <div className="field"><label htmlFor="erpCategory">ERP category <span className="optional">Optional for drafts</span></label>
        <InputText id="erpCategory" value={erpCategory} onChange={e => setCategory(e.target.value)} maxLength={80} disabled={saving} placeholder="e.g. Mechanical Components" invalid={!!fields.erpCategory} aria-describedby="erpCategory-error" />{fieldError('erpCategory')}</div>
      <p className="form-note"><i className="pi pi-info-circle" /> Saving changes resets the product to Draft.</p>
      <div className="dialog-actions"><Button label="Cancel" type="button" outlined onClick={onClose} disabled={saving} /><Button label="Save product" type="submit" loading={saving} /></div>
    </form>
  </Dialog>;
}
