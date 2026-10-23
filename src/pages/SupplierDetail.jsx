import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Truck, Wallet, ShoppingCart, BookOpen, Trash2 } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Card, Badge, Button, Spinner, EmptyState, Modal, Input, Select } from '../components/ui';
import LineItemsEditor from '../components/LineItemsEditor';

const TABS = [
  { key: 'purchases', label: 'Purchase Invoices', icon: ShoppingCart },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'ledger', label: 'Ledger', icon: BookOpen },
];

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('purchases');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/suppliers/${id}`).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/products').then(res => setProducts(res.data.products)); }, []);

  async function handleDeleteSupplier() {
    const ok = confirm(
      `Permanently delete "${data.supplier.name}"?\n\nThis will also remove their purchase orders, purchase invoices, payments, and ledger entries.\n\nThis cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/suppliers/${id}`);
      navigate('/suppliers');
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete supplier.'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !data) return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;

  const { supplier, purchaseInvoices, payments, ledger } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
          <ArrowLeft size={15} /> Back to Suppliers
        </button>
        <Button variant="danger" size="sm" onClick={handleDeleteSupplier} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete Supplier'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 h-fit">
          <h1 className="font-display font-bold text-xl text-ink-900">{supplier.name}</h1>
          {supplier.company && <p className="text-sm text-ink-700/60">{supplier.company}</p>}
          <div className="space-y-2 text-sm mt-4">
            {supplier.phone && <p className="text-ink-700/80">{supplier.phone}</p>}
            {supplier.city && <p className="text-ink-700/80">{supplier.city}</p>}
          </div>
          <div className="border-t border-surface-border mt-4 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-ink-700/60">Current Balance</span>
              <span className={`font-mono-num font-bold ${supplier.current_balance > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{formatMoney(supplier.current_balance)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Button size="sm" onClick={() => setPurchaseModalOpen(true)}><Plus size={14} /> New Purchase Invoice</Button>
            <Button size="sm" variant="outline" onClick={() => setPayModalOpen(true)}><Wallet size={14} /> Make Payment</Button>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card className="p-2">
            <div className="flex gap-1 p-1">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-700 text-white' : 'text-ink-700/60 hover:bg-surface-soft'}`}>
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 mt-4">
            {tab === 'purchases' && (
              purchaseInvoices.length === 0 ? <EmptyState icon={ShoppingCart} title="No purchase invoices yet" /> : (
                <div className="divide-y divide-surface-border">
                  {purchaseInvoices.map(pi => (
                    <div key={pi.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium text-ink-900">{pi.purchase_invoice_number}</p>
                        <p className="text-xs text-ink-700/50">{formatDate(pi.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={pi.status === 'paid' ? 'green' : 'amber'}>{pi.status}</Badge>
                        <span className="font-mono-num font-semibold w-28 text-right">{formatMoney(pi.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
            {tab === 'payments' && (
              payments.length === 0 ? <EmptyState icon={Wallet} title="No payments recorded yet" /> : (
                <div className="divide-y divide-surface-border">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                      <div><p className="text-ink-800 capitalize">{formatDate(p.date)} · {p.method}</p></div>
                      <span className="font-mono-num font-semibold text-accent-green">{formatMoney(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )
            )}
            {tab === 'ledger' && (
              ledger.length === 0 ? <EmptyState icon={BookOpen} title="No ledger entries yet" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                        <th className="py-2 font-medium">Date</th><th className="py-2 font-medium">Description</th>
                        <th className="py-2 font-medium text-right">Debit</th><th className="py-2 font-medium text-right">Credit</th><th className="py-2 font-medium text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {ledger.map(e => (
                        <tr key={e.id}>
                          <td className="py-2.5 text-ink-700/70">{formatDate(e.entry_date)}</td>
                          <td className="py-2.5">{e.description || e.reference_type}</td>
                          <td className="py-2.5 text-right font-mono-num text-accent-red">{e.type === 'debit' ? formatMoney(e.amount) : ''}</td>
                          <td className="py-2.5 text-right font-mono-num text-accent-green">{e.type === 'credit' ? formatMoney(e.amount) : ''}</td>
                          <td className="py-2.5 text-right font-mono-num font-semibold">{formatMoney(e.running_balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </Card>
        </div>
      </div>

      <NewPurchaseInvoiceModal open={purchaseModalOpen} onClose={() => setPurchaseModalOpen(false)} supplierId={id} products={products} onSaved={load} />
      <MakePaymentModal open={payModalOpen} onClose={() => setPayModalOpen(false)} supplierId={id} onSaved={load} />
    </div>
  );
}

function NewPurchaseInvoiceModal({ open, onClose, supplierId, products, onSaved }) {
  const [date, setDate] = useState(todayISO());
  const [taxAmount, setTaxAmount] = useState(0);
  const [items, setItems] = useState([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/purchases/invoices', { supplier_id: supplierId, date, tax_amount: taxAmount, items });
      onClose();
      onSaved();
      setItems([{ product_id: '', description: '', quantity: 1, unit_price: 0 }]);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create purchase invoice.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Purchase Invoice" width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <LineItemsEditor items={items} onChange={setItems} products={products} priceField="purchase_price" />
        <Input label="Tax amount" type="number" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} />
        <p className="text-xs text-ink-700/50">Products with a matching item will have their stock increased automatically.</p>
        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Purchase Invoice'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function MakePaymentModal({ open, onClose, supplierId, onSaved }) {
  const [form, setForm] = useState({ amount: '', method: 'cash', reference_no: '', date: todayISO(), notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/suppliers/${supplierId}/payments`, form);
      onClose();
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record payment.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Make Payment to Supplier">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        <Select label="Method" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
          {['cash', 'bank', 'cheque', 'online'].map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input label="Reference number" value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} />
        <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
        </div>
      </form>
    </Modal>
  );
}
