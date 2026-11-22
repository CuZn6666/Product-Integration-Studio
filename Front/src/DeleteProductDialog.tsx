import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { api, type Product } from './api';

interface Props { product: Product; onClose: () => void; onDeleted: (product: Product) => void }

export default function DeleteProductDialog({ product, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    if (deleting) return;
    setDeleting(true); setError('');
    try {
      await api.delete(product.id);
      onDeleted(product);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete product. Please retry.');
    } finally { setDeleting(false); }
  }

  return <Dialog header="Delete product?" visible modal className="product-dialog" draggable={false}
    onHide={() => { if (!deleting) onClose(); }} closable={!deleting} closeOnEscape={!deleting}>
    <p className="dialog-intro">Delete <strong>{product.name}</strong> (<code>{product.sku}</code>) from the local database? This cannot be undone.</p>
    <p className="form-note">No external ERP system will be changed.</p>
    {error && <div className="notice error" role="alert">{error}</div>}
    <div className="dialog-actions">
      <Button label="Cancel" outlined autoFocus disabled={deleting} onClick={onClose} />
      <Button label="Delete product" icon="pi pi-trash" className="delete-button" severity="danger" loading={deleting} disabled={deleting} onClick={() => void remove()} />
    </div>
  </Dialog>;
}
