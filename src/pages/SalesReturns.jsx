import { useEffect, useState, useCallback } from 'react';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Card, Button, Input, Select, Modal, Spinner, EmptyState } from '../components/ui';
import LineItemsEditor from '../components/LineItemsEditor';

export default function SalesReturns() {
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/sales-returns')
      .then((res) => setReturns(res.data.salesReturns || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/customers').then((res) => setCustomers(res.data.customers || []));
    api.get('/products').then((res) => setProducts(res.data.products || []));
    api.get('/invoices').then((res) => setInvoices(res.data.invoices || []));
  }, []);

  async function handleDelete(row) {
    if (!confirm(`Delete sales return ${row.return_number}? Stock and ledger will be reversed.`)) return;
    try {
      await api.delete(`/sales-returns/${row.id}`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete sales return.'));
    }
  }

  const total = returns.reduce((s, r) => s + Number(r.total || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Sales Returns</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">
            Record customer returns · inventory and ledger update automatically
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Return</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-xs text-ink-700/50 mb-1">Returns recorded</p>
          <p className="font-mono-num font-bold text-xl">{returns.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-ink-700/50 mb-1">Total return value</p>
          <p className="font-mono-num font-bold text-xl text-accent-amber">{formatMoney(total)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : returns.length === 0 ? (
          <EmptyState
            icon={RotateCcw}
            title="No sales returns yet"
            description="When a customer returns products after a sale, record it here to restore stock."
            action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Return</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Return #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-soft/60">
                    <td className="px-5 py-3 font-medium">{r.return_number}</td>
                    <td className="px-5 py-3">{r.customer_name}</td>
                    <td className="px-5 py-3 text-ink-700/70">{r.invoice_number || '—'}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(r.date)}</td>
                    <td className="px-5 py-3 text-ink-700/70 truncate max-w-[12rem]">{r.reason || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold">{formatMoney(r.total)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="w-8 h-8 rounded-lg hover:bg-accent-redLight hover:text-accent-red inline-flex items-center justify-center text-ink-700/60"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewReturnModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customers={customers}
        products={products}
        invoices={invoices}
        onSaved={load}
      />
    </div>
  );
}

function NewReturnModal({ open, onClose, customers, products, invoices, onSaved }) {
  const [customerId, setCustomerId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const customerInvoices = invoices.filter((i) => String(i.customer_id) === String(customerId));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/sales-returns', {
        customer_id: Number(customerId),
        invoice_id: invoiceId ? Number(invoiceId) : undefined,
        date,
        reason,
        tax_amount: taxAmount,
        items,
      });
      onClose();
      onSaved();
      setCustomerId('');
      setInvoiceId('');
      setReason('');
      setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save sales return.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Sales Return" width="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Select
            label="Customer"
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value); setInvoiceId(''); }}
            required
          >
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select
            label="Original invoice (optional)"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          >
            <option value="">None</option>
            {customerInvoices.map((i) => (
              <option key={i.id} value={i.id}>{i.invoice_number} · {formatMoney(i.total)}</option>
            ))}
          </Select>
          <Input label="Return date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged, wrong item…" />
        </div>
        <LineItemsEditor items={items} onChange={setItems} products={products} />
        <Input label="Tax amount" type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
        <p className="text-xs text-ink-700/50">
          Returned products are added back to inventory and the customer ledger is credited.
        </p>
        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Return'}</Button>
        </div>
      </form>
    </Modal>
  );
}
