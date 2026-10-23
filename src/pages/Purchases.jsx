import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShoppingCart, Search } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Card, Button, Input, Select, Modal, Badge, Spinner, EmptyState } from '../components/ui';
import LineItemsEditor from '../components/LineItemsEditor';

export default function Purchases() {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/purchases/invoices')
      .then((res) => setInvoices(res.data.purchaseInvoices || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/suppliers').then((res) => setSuppliers(res.data.suppliers || []));
    api.get('/products').then((res) => setProducts(res.data.products || []));
  }, []);

  const filtered = invoices.filter((pi) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(pi.purchase_invoice_number || '').toLowerCase().includes(q)
      || String(pi.supplier_name || '').toLowerCase().includes(q)
    );
  });

  const totalValue = filtered.reduce((s, pi) => s + Number(pi.total || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Purchases</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">
            Record supplier purchases · stock updates automatically
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Purchase</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-ink-700/50 mb-1">Purchase invoices</p>
          <p className="font-mono-num font-bold text-xl">{filtered.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-700/50 mb-1">Total purchase value</p>
          <p className="font-mono-num font-bold text-xl">{formatMoney(totalValue)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-700/50 mb-1">Unpaid balance</p>
          <p className="font-mono-num font-bold text-xl text-accent-red">
            {formatMoney(filtered.reduce((s, pi) => s + Number(pi.balance || 0), 0))}
          </p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or supplier…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No purchases yet"
            description="Record purchases from local suppliers and markets. Inventory updates automatically."
            action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Purchase</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Invoice #</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((pi) => (
                  <tr key={pi.id} className="hover:bg-surface-soft/60">
                    <td className="px-5 py-3 font-medium text-ink-900">{pi.purchase_invoice_number}</td>
                    <td className="px-5 py-3">
                      <Link to={`/suppliers/${pi.supplier_id}`} className="text-brand-700 hover:underline">
                        {pi.supplier_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(pi.date)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={pi.status === 'paid' ? 'green' : pi.status === 'partial' ? 'amber' : 'red'}>
                        {pi.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold">{formatMoney(pi.total)}</td>
                    <td className="px-5 py-3 text-right font-mono-num">{formatMoney(pi.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewPurchaseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        suppliers={suppliers}
        products={products}
        onSaved={load}
      />
    </div>
  );
}

function NewPurchaseModal({ open, onClose, suppliers, products, onSaved }) {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/purchases/invoices', {
        supplier_id: Number(supplierId),
        date,
        tax_amount: taxAmount,
        items,
      });
      onClose();
      onSaved();
      setSupplierId('');
      setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
      setTaxAmount(0);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create purchase invoice.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Purchase Invoice" width="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Select
            label="Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          >
            <option value="">Select supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Input label="Purchase date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <LineItemsEditor items={items} onChange={setItems} products={products} priceField="purchase_price" />
        <Input label="Tax amount" type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
        <p className="text-xs text-ink-700/50">
          Matching products will have stock increased automatically after save.
        </p>
        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Purchase'}</Button>
        </div>
      </form>
    </Modal>
  );
}
