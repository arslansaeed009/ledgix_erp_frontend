import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Package, ArrowUpDown } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, formatDateTime } from '../lib/format';
import { Card, Badge, Button, Spinner, EmptyState } from '../components/ui';

const MOVEMENT_LABELS = {
  in: { label: 'Stock In', tone: 'green' },
  out: { label: 'Stock Out', tone: 'red' },
  adjustment: { label: 'Adjustment', tone: 'amber' },
  transfer: { label: 'Transfer', tone: 'brand' },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/products/${id}`).then(res => {
      setProduct(res.data.product);
      setMovements(res.data.movements);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      navigate('/products');
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete product.'));
    }
  }

  if (loading || !product) return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;

  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
  const isLow = product.stock_qty <= product.reorder_level && product.stock_qty > 0;
  const isOut = product.stock_qty <= 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Products
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink-900">{product.name}</h1>
            {isOut && <Badge tone="red">Out of stock</Badge>}
            {isLow && <Badge tone="amber">Low stock</Badge>}
          </div>
          <p className="text-sm text-ink-700/60 mt-0.5">{product.category_name || 'Uncategorized'} {product.brand && `· ${product.brand}`}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory"><Button variant="outline"><ArrowUpDown size={15} /> Manage Stock</Button></Link>
          <Link to={`/products/${id}/edit`}><Button variant="outline"><Pencil size={15} /> Edit</Button></Link>
          <Button variant="danger" onClick={handleDelete}><Trash2 size={15} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <div className="aspect-square rounded-xl bg-surface-soft flex items-center justify-center overflow-hidden mb-4">
            {primaryImage ? (
              <img src={`${api.defaults.baseURL.replace('/api', '')}${primaryImage.file_path}`} className="w-full h-full object-cover" />
            ) : <Package size={40} className="text-ink-700/20" />}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map(img => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-surface-soft">
                  <img src={`${api.defaults.baseURL.replace('/api', '')}${img.file_path}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Sale Price" value={formatMoney(product.sale_price)} />
            <Stat label="Dealer Price" value={formatMoney(product.dealer_price)} />
            <Stat label="Purchase Price" value={formatMoney(product.purchase_price)} />
            <Stat label="Tax" value={`${product.tax_percent}%`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-surface-border pt-5">
            <Stat label="Stock" value={product.stock_qty} highlight={isOut ? 'red' : isLow ? 'amber' : undefined} />
            <Stat label="Reorder Level" value={product.reorder_level} />
            <Stat label="Warehouse" value={product.warehouse_name || '—'} />
            <Stat label="SKU" value={product.sku || '—'} mono />
          </div>
          {(product.barcode || product.serial_number || product.warranty || product.location) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-surface-border pt-5">
              {product.barcode && <Stat label="Barcode" value={product.barcode} mono />}
              {product.serial_number && <Stat label="Serial No." value={product.serial_number} mono />}
              {product.warranty && <Stat label="Warranty" value={product.warranty} />}
              {product.location && <Stat label="Location" value={product.location} />}
            </div>
          )}
          {product.description && (
            <div className="border-t border-surface-border pt-5">
              <p className="text-xs font-semibold text-ink-700/50 mb-1">DESCRIPTION</p>
              <p className="text-sm text-ink-800">{product.description}</p>
            </div>
          )}
          {product.specifications && (
            <div className="border-t border-surface-border pt-5">
              <p className="text-xs font-semibold text-ink-700/50 mb-1">SPECIFICATIONS</p>
              <p className="text-sm text-ink-800 whitespace-pre-line">{product.specifications}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-4">Stock Movement History</h3>
        {movements.length === 0 ? (
          <EmptyState icon={ArrowUpDown} title="No stock movements yet" description="Stock in, out, adjustments and transfers will appear here." />
        ) : (
          <div className="divide-y divide-surface-border">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <Badge tone={MOVEMENT_LABELS[m.type]?.tone || 'gray'}>{MOVEMENT_LABELS[m.type]?.label || m.type}</Badge>
                  <div>
                    <p className="text-ink-800">{m.notes || m.reference_type}</p>
                    {m.type === 'transfer' && <p className="text-xs text-ink-700/50">{m.warehouse_from_name} → {m.warehouse_to_name}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-num font-semibold">{m.type === 'out' ? '-' : m.type === 'in' ? '+' : ''}{Math.abs(m.quantity)}</p>
                  <p className="text-xs text-ink-700/50">{formatDateTime(m.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, mono, highlight }) {
  const toneClass = highlight === 'red' ? 'text-accent-red' : highlight === 'amber' ? 'text-accent-amber' : 'text-ink-900';
  return (
    <div>
      <p className="text-xs text-ink-700/50 mb-0.5">{label}</p>
      <p className={`font-semibold ${mono ? 'font-mono-num' : 'font-display'} ${toneClass}`}>{value}</p>
    </div>
  );
}
