import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Wallet } from 'lucide-react';
import api, { apiErrorMessage, openAuthFile } from '../lib/api';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Card, Button, Select, EmptyState, Spinner, Modal, Input } from '../components/ui';

const METHODS = ['cash', 'bank', 'cheque', 'jazzcash', 'easypaisa', 'card', 'online'];

export default function Payments() {
  const [params] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const [form, setForm] = useState({ customer_id: '', invoice_id: '', amount: '', method: 'cash', reference_no: '', date: todayISO(), notes: '' });
  const [error, setError] = useState('');
  const [openingReceiptId, setOpeningReceiptId] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/payments', { params: { search: search || undefined, method: method || undefined } })
      .then(res => setPayments(res.data.payments))
      .finally(() => setLoading(false));
  }, [search, method]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/customers').then(res => setCustomers(res.data.customers)); }, []);

  useEffect(() => {
    if (!form.customer_id) { setInvoices([]); return; }
    api.get('/invoices', { params: { customer_id: form.customer_id, status: 'pending' } }).then(res => setInvoices(res.data.invoices));
  }, [form.customer_id]);

  function openNew() {
    setForm({ customer_id: '', invoice_id: '', amount: '', method: 'cash', reference_no: '', date: todayISO(), notes: '' });
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/payments', { ...form, invoice_id: form.invoice_id || undefined });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record payment.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenReceipt(payment) {
    setOpeningReceiptId(payment.id);
    try {
      await openAuthFile(`/pdf/receipt/${payment.id}`, { filename: `${payment.payment_number}.pdf` });
    } catch (err) {
      alert(err.message || apiErrorMessage(err, 'Could not generate receipt PDF. Please try again.'));
    } finally {
      setOpeningReceiptId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Payments</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> Receive Payment</Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by receipt # or customer…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40" />
        </div>
        <Select value={method} onChange={e => setMethod(e.target.value)} className="sm:w-48">
          <option value="">All Methods</option>
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments recorded yet" description="Receive a payment from a customer, against an invoice or as a general advance."
            action={<Button onClick={openNew}><Plus size={16} /> Receive Payment</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Receipt #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-900">
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(p)}
                        disabled={openingReceiptId === p.id}
                        className="hover:text-brand-700 disabled:opacity-50"
                      >
                        {openingReceiptId === p.id ? 'Opening…' : p.payment_number}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-ink-700/80">
                      <button onClick={() => navigate(`/customers/${p.customer_id}`)} className="hover:text-brand-700">{p.customer_name}</button>
                    </td>
                    <td className="px-5 py-3 text-ink-700/70">{p.invoice_number || <span className="text-ink-700/30">Advance</span>}</td>
                    <td className="px-5 py-3 text-ink-700/70 capitalize">{p.method}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(p.date)}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold text-accent-green">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Receive Payment">
        <form onSubmit={handleSave} className="space-y-4">
          <Select label="Customer" required value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value, invoice_id: '' }))}>
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({formatMoney(c.current_balance)})</option>)}
          </Select>
          <Select label="Against invoice (optional — leave blank for an advance)" value={form.invoice_id} onChange={e => setForm(f => ({ ...f, invoice_id: e.target.value }))}>
            <option value="">No specific invoice (advance payment)</option>
            {invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_number} — balance {formatMoney(i.balance)}</option>)}
          </Select>
          <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Select label="Payment method" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Reference number (optional)" value={form.reference_no} onChange={e => setForm(f => ({ ...f, reference_no: e.target.value }))} />
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
