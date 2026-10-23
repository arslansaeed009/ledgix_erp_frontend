import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, ArrowLeftRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { Card, Button, Select, Input, Badge, Modal, EmptyState } from '../components/ui';

const MOVEMENT_LABELS = {
  in: { label: 'Stock In', tone: 'green' },
  out: { label: 'Stock Out', tone: 'red' },
  adjustment: { label: 'Adjustment', tone: 'amber' },
  transfer: { label: 'Transfer', tone: 'brand' },
};

const ACTIONS = [
  { key: 'stock-in', label: 'Stock In', icon: ArrowDownCircle, tone: 'text-accent-green bg-accent-greenLight' },
  { key: 'stock-out', label: 'Stock Out', icon: ArrowUpCircle, tone: 'text-accent-red bg-accent-redLight' },
  { key: 'adjustment', label: 'Adjustment', icon: SlidersHorizontal, tone: 'text-accent-amber bg-accent-amberLight' },
  { key: 'transfer', label: 'Transfer', icon: ArrowLeftRight, tone: 'text-brand-700 bg-brand-50' },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], outOfStock: [] });
  const [activeAction, setActiveAction] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/inventory/movements').then(res => setMovements(res.data.movements));
    api.get('/inventory/alerts').then(res => setAlerts(res.data));
  }, []);

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data.products));
    api.get('/warehouses').then(res => setWarehouses(res.data.warehouses));
    load();
  }, [load]);

  function openAction(key) {
    setActiveAction(key);
    setForm({});
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/inventory/${activeAction}`, form);
      setActiveAction(null);
      load();
      api.get('/products').then(res => setProducts(res.data.products));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete this action.'));
    } finally {
      setSaving(false);
    }
  }

  const actionTitles = {
    'stock-in': 'Stock In (Purchase Entry)',
    'stock-out': 'Stock Out',
    adjustment: 'Stock Adjustment',
    transfer: 'Transfer Stock',
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/products')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Products
      </button>

      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Inventory Management</h1>
        <p className="text-sm text-ink-700/60 mt-0.5">Stock in, stock out, adjustments and transfers — fully audit-logged</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ACTIONS.map(a => (
          <button key={a.key} onClick={() => openAction(a.key)} className="text-left">
            <Card className="p-5 hover:shadow-cardHover transition-shadow h-full">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.tone}`}>
                <a.icon size={19} />
              </div>
              <p className="font-medium text-ink-900 text-sm">{a.label}</p>
            </Card>
          </button>
        ))}
      </div>

      {(alerts.lowStock.length > 0 || alerts.outOfStock.length > 0) && (
        <Card className="p-5">
          <h3 className="font-display font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-amber" /> Stock Alerts
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {alerts.outOfStock.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-accent-red mb-2">OUT OF STOCK ({alerts.outOfStock.length})</p>
                <div className="space-y-1.5">
                  {alerts.outOfStock.map(p => (
                    <Link key={p.id} to={`/products/${p.id}`} className="flex justify-between text-sm hover:text-brand-700">
                      <span>{p.name}</span><Badge tone="red">0</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {alerts.lowStock.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-accent-amber mb-2">LOW STOCK ({alerts.lowStock.length})</p>
                <div className="space-y-1.5">
                  {alerts.lowStock.map(p => (
                    <Link key={p.id} to={`/products/${p.id}`} className="flex justify-between text-sm hover:text-brand-700">
                      <span>{p.name}</span><Badge tone="amber">{p.stock_qty} left</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-4">Recent Stock Movements</h3>
        {movements.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="No stock movements yet" description="Actions above will be logged here." />
        ) : (
          <div className="divide-y divide-surface-border">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <Badge tone={MOVEMENT_LABELS[m.type]?.tone}>{MOVEMENT_LABELS[m.type]?.label}</Badge>
                  <div>
                    <p className="text-ink-800 font-medium">{m.product_name}</p>
                    <p className="text-xs text-ink-700/50">{m.notes || m.reference_type}</p>
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

      <Modal open={!!activeAction} onClose={() => setActiveAction(null)} title={actionTitles[activeAction] || ''}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Product" required value={form.product_id || ''} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock_qty} in stock)</option>)}
          </Select>

          {activeAction === 'adjustment' ? (
            <Input label="New quantity (physical count)" type="number" required
              value={form.new_quantity || ''} onChange={e => setForm(f => ({ ...f, new_quantity: e.target.value }))} />
          ) : (
            <Input label="Quantity" type="number" required
              value={form.quantity || ''} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          )}

          {activeAction === 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="From warehouse" required value={form.warehouse_from_id || ''} onChange={e => setForm(f => ({ ...f, warehouse_from_id: e.target.value }))}>
                <option value="">Select</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
              <Select label="To warehouse" required value={form.warehouse_to_id || ''} onChange={e => setForm(f => ({ ...f, warehouse_to_id: e.target.value }))}>
                <option value="">Select</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
          )}

          {(activeAction === 'stock-in' || activeAction === 'stock-out') && (
            <Select label="Warehouse (optional)" value={form.warehouse_id || ''} onChange={e => setForm(f => ({ ...f, warehouse_id: e.target.value }))}>
              <option value="">Use product's current warehouse</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          )}

          <Input label="Notes" value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setActiveAction(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Confirm'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
