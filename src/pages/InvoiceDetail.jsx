import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, MessageCircle, Wallet, XCircle, Pencil, Trash2, Printer } from 'lucide-react';
import api, { apiErrorMessage, openAuthFile } from '../lib/api';
import { useCompany } from '../lib/CompanyContext';
import { formatMoney, formatDate, todayISO, buildWhatsAppLink } from '../lib/format';
import { Card, Badge, Button, Spinner, Modal, Input, Select } from '../components/ui';

const STATUS_TONE = { pending: 'amber', partial: 'amber', paid: 'green', overdue: 'red', cancelled: 'gray' };
const METHODS = ['cash', 'bank', 'cheque', 'jazzcash', 'easypaisa', 'card', 'online'];

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', reference_no: '', date: todayISO(), notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [customerBalance, setCustomerBalance] = useState(null);
  const { brandLabel, settings } = useCompany();

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/invoices/${id}`).then(res => {
      setInvoice(res.data.invoice);
      setItems(res.data.items);
      setPayments(res.data.payments);
      setPayForm(f => ({ ...f, amount: res.data.invoice.balance }));
      api.get(`/customers/${res.data.invoice.customer_id}`).then(cr => setCustomerBalance(cr.data.customer.current_balance));
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleRecordPayment(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/payments', { customer_id: invoice.customer_id, invoice_id: id, ...payForm });
      setPayOpen(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record payment.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    const message = invoice.doc_type === 'bill'
      ? 'Cancel this bill? Stock will be restored and the bill amount reversed in the ledger. Any recorded payments will remain on the customer account; no refund will be issued.'
      : 'Cancel this invoice? Stock will be restored and the ledger adjusted.';
    if (!confirm(message)) return;
    try {
      await api.put(`/invoices/${id}/cancel`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not cancel invoice.'));
    }
  }

  async function handleDelete() {
    const label = invoice.doc_type === 'bill' ? 'bill' : 'invoice';
    const billPaymentNote = invoice.doc_type === 'bill'
      ? ' Any recorded payments will remain as unallocated customer payments; no refund will be issued.'
      : '';
    const msg = invoice.status === 'cancelled'
      ? `Permanently delete ${label} ${invoice.invoice_number}? This cannot be undone.${billPaymentNote}`
      : `Permanently delete ${label} ${invoice.invoice_number}? Stock will be restored, the ledger adjusted, and this cannot be undone.${billPaymentNote}`;
    if (!confirm(msg)) return;
    try {
      await api.delete(`/invoices/${id}`);
      navigate('/invoices');
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete invoice.'));
    }
  }

  async function handleOpenPdf() {
    setPdfLoading(true);
    try {
      await openAuthFile(`/pdf/invoice/${id}`, { filename: `${invoice.invoice_number}.pdf` });
    } catch (err) {
      alert(err.message || apiErrorMessage(err, 'Could not generate PDF. Please try again.'));
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading || !invoice) return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;

  const docLabel = invoice.doc_type === 'bill' ? 'bill' : 'invoice';
  const waLink = settings.company_phone ? buildWhatsAppLink(
    settings.company_phone,
    brandLabel
      ? `Hi ${invoice.customer_name}, please find your ${docLabel} ${invoice.invoice_number} from ${brandLabel} (Total: ${formatMoney(invoice.total)}, Balance: ${formatMoney(invoice.balance)}). I'll attach the PDF now.`
      : `Hi ${invoice.customer_name}, please find your ${docLabel} ${invoice.invoice_number} (Total: ${formatMoney(invoice.total)}, Balance: ${formatMoney(invoice.balance)}). I'll attach the PDF now.`
  ) : null;
  const discountAmount = invoice.discount_type === 'percent'
    ? Number(invoice.subtotal) * (Number(invoice.discount_value) || 0) / 100
    : Number(invoice.discount_value) || 0;
  const hasNoPayments = Number(invoice.paid_amount) === 0;
  const isBill = invoice.doc_type === 'bill';
  const canRecordPayment = invoice.status !== 'cancelled' && Number(invoice.balance) > 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/invoices')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Invoices
      </button>
      {location.state?.posPaymentError && (
        <p className="rounded-lg bg-accent-redLight px-3 py-2 text-sm text-accent-red" role="alert">
          Bill created, but payment could not be recorded: {location.state.posPaymentError}
        </p>
      )}

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink-900">{invoice.invoice_number}</h1>
            <Badge tone={invoice.doc_type === 'bill' ? 'gray' : 'brand'}>{invoice.doc_type === 'bill' ? 'Bill' : 'Invoice'}</Badge>
            <Badge tone={invoice.is_overdue ? 'red' : STATUS_TONE[invoice.status]}>{invoice.is_overdue ? 'overdue' : invoice.status}</Badge>
          </div>
          <p className="text-sm text-ink-700/60 mt-0.5">
            <Link to={`/customers/${invoice.customer_id}`} className="hover:text-brand-700">{invoice.customer_name}</Link> · {formatDate(invoice.date)}
            {invoice.due_date && ` · Due ${formatDate(invoice.due_date)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={15} /> Thermal Print
          </Button>
          <Button variant="outline" onClick={handleOpenPdf} disabled={pdfLoading}>
            {pdfLoading ? <Spinner size={15} /> : <Download size={15} />}
            {pdfLoading ? 'Generating…' : 'PDF'}
          </Button>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer"><Button variant="secondary"><MessageCircle size={15} /> WhatsApp</Button></a>}
          {invoice.status !== 'cancelled' && hasNoPayments && (
            <Link to={`/invoices/${id}/edit`}><Button variant="outline"><Pencil size={15} /> {isBill ? 'Edit Bill' : 'Edit'}</Button></Link>
          )}
          {canRecordPayment && (
            <Button onClick={() => setPayOpen(true)}><Wallet size={15} /> Record Payment</Button>
          )}
          {invoice.status !== 'cancelled' && hasNoPayments && (
            <Button variant="danger" onClick={handleCancel}><XCircle size={15} /> {isBill ? 'Cancel Bill' : 'Cancel Invoice'}</Button>
          )}
          {hasNoPayments && (
            <Button variant="danger" onClick={handleDelete}><Trash2 size={15} /> {isBill ? 'Delete Bill' : 'Delete Invoice'}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total" value={formatMoney(invoice.total)} />
        <Stat label="Paid" value={formatMoney(invoice.paid_amount)} tone="green" />
        <Stat label={`Balance (this ${invoice.doc_type === 'bill' ? 'bill' : 'invoice'})`} value={formatMoney(invoice.balance)} tone={invoice.balance > 0 ? 'red' : undefined} />
        <Stat label="Customer's Total Account Balance" value={customerBalance !== null ? formatMoney(customerBalance) : '—'} tone={customerBalance > 0 ? 'red' : customerBalance < 0 ? 'green' : undefined} />
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Unit Price</th>
                <th className="py-2 font-medium">Tax</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {items.map(it => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.description}</td>
                  <td className="py-2.5">{it.quantity}</td>
                  <td className="py-2.5 font-mono-num">{formatMoney(it.unit_price)}</td>
                  <td className="py-2.5">{it.tax_percent}%</td>
                  <td className="py-2.5 text-right font-mono-num font-medium">{formatMoney(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatMoney(invoice.subtotal)} />
            <Row label="Tax" value={formatMoney(invoice.tax_amount)} />
            {invoice.shipping_amount > 0 && <Row label="Shipping" value={formatMoney(invoice.shipping_amount)} />}
            <div className="border-t border-surface-border pt-1.5">
              <Row label="Total" value={formatMoney(invoice.total)} bold />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-ink-700/50">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{p.payment_number}</p>
                  <p className="text-xs text-ink-700/50 capitalize">{formatDate(p.date)} · {p.method}</p>
                </div>
                <span className="font-mono-num font-semibold text-accent-green">{formatMoney(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input label="Amount" type="number" step="0.01" required value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
          <Select label="Payment method" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
          <Input label="Reference number (optional)" value={payForm.reference_no} onChange={e => setPayForm(f => ({ ...f, reference_no: e.target.value }))} />
          <Input label="Date" type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</Button>
          </div>
        </form>
      </Modal>

      <section className="thermal-print" aria-label="Thermal invoice receipt">
        {brandLabel && <h1 className="thermal-center thermal-company">{brandLabel}</h1>}
        <p className="thermal-center thermal-title">{invoice.doc_type === 'bill' ? 'BILL' : 'INVOICE'}</p>
        <div className="thermal-meta">
          <p><strong>No:</strong> {invoice.invoice_number}</p>
          <p><strong>Date:</strong> {formatDate(invoice.date)}</p>
          {invoice.due_date && <p><strong>Due:</strong> {formatDate(invoice.due_date)}</p>}
          <p><strong>Customer:</strong> {invoice.customer_name}</p>
        </div>
        <table className="thermal-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th className="thermal-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.description}<br /><span>{formatMoney(item.unit_price)} each</span></td>
                <td>{item.quantity}</td>
                <td className="thermal-right">{formatMoney(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="thermal-totals">
          <p><span>Subtotal</span><span>{formatMoney(invoice.subtotal)}</span></p>
          {discountAmount > 0 && <p><span>Discount</span><span>- {formatMoney(discountAmount)}</span></p>}
          <p><span>Tax</span><span>{formatMoney(invoice.tax_amount)}</span></p>
          {invoice.shipping_amount > 0 && <p><span>Shipping</span><span>{formatMoney(invoice.shipping_amount)}</span></p>}
          <p className="thermal-grand-total"><span>Total</span><span>{formatMoney(invoice.total)}</span></p>
          <p><span>Paid</span><span>{formatMoney(invoice.paid_amount)}</span></p>
          <p><span>Balance</span><span>{formatMoney(invoice.balance)}</span></p>
        </div>
        <p className="thermal-center thermal-thanks">Thank you</p>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const toneClass = tone === 'green' ? 'text-accent-green' : tone === 'red' ? 'text-accent-red' : 'text-ink-900';
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-700/50 mb-1">{label}</p>
      <p className={`font-mono-num font-bold text-lg ${toneClass}`}>{value}</p>
    </Card>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-ink-700/70 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`font-mono-num ${bold ? 'font-bold text-base text-brand-700' : 'font-medium text-ink-900'}`}>{value}</span>
    </div>
  );
}
