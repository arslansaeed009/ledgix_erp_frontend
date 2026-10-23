import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MessageCircle, Mail, MapPin, FileText, Receipt, Wallet,
  BookOpen, Paperclip, Upload, Download, Trash2
} from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { useCompany } from '../lib/CompanyContext';
import { formatMoney, formatDate, buildWhatsAppLink } from '../lib/format';
import { Card, Badge, Button, Spinner, EmptyState } from '../components/ui';

const TABS = [
  { key: 'ledger', label: 'Ledger', icon: BookOpen },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'quotations', label: 'Quotations', icon: FileText },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'documents', label: 'Documents', icon: Paperclip },
];

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState(null);
  const [tab, setTab] = useState('ledger');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef(null);
  const { brandLabel } = useCompany();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/customers/${id}/history`)
    ]).then(([a, b]) => {
      setCustomer(a.data.customer);
      setDocuments(a.data.documents);
      setHistory(b.data);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/customers/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      load();
    } catch (err) {
      alert(apiErrorMessage(err, 'Upload failed.'));
    } finally {
      e.target.value = '';
    }
  }

  async function handleDeleteDoc(docId) {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/customers/${id}/documents/${docId}`);
    load();
  }

  async function handleDeleteCustomer() {
    const ok = confirm(
      `Permanently delete "${customer.name}"?\n\nThis will also remove their invoices, quotations, payments, ledger entries, and documents. Stock from active invoices will be restored.\n\nThis cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${id}`);
      navigate('/customers');
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete customer.'));
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !customer) {
    return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;
  }

  const balanceTone = customer.current_balance > 0 ? 'text-accent-red' : customer.current_balance < 0 ? 'text-accent-green' : 'text-ink-700/60';
  const waLink = customer.whatsapp ? buildWhatsAppLink(
    customer.whatsapp,
    brandLabel
      ? `Hi ${customer.name}, this is regarding your account with ${brandLabel}.`
      : `Hi ${customer.name}, this is regarding your account.`
  ) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => navigate('/customers')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
          <ArrowLeft size={15} /> Back to Customers
        </button>
        <Button variant="danger" size="sm" onClick={handleDeleteCustomer} disabled={deleting}>
          <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete Customer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 h-fit">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-xl text-ink-900">{customer.name}</h1>
              {customer.company && <p className="text-sm text-ink-700/60">{customer.company}</p>}
            </div>
            <Badge tone="brand">{customer.customer_type}</Badge>
          </div>

          <div className="space-y-2.5 text-sm mb-5">
            {customer.phone && <p className="flex items-center gap-2 text-ink-700/80"><Phone size={14} /> {customer.phone}</p>}
            {customer.email && <p className="flex items-center gap-2 text-ink-700/80"><Mail size={14} /> {customer.email}</p>}
            {customer.city && <p className="flex items-center gap-2 text-ink-700/80"><MapPin size={14} /> {customer.city}, {customer.country}</p>}
          </div>

          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full mb-3"><MessageCircle size={16} /> Message on WhatsApp</Button>
            </a>
          )}

          <div className="border-t border-surface-border pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-ink-700/60">Current Balance</span>
              <span className={`font-mono-num font-bold ${balanceTone}`}>{formatMoney(customer.current_balance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-700/60">Credit Limit</span>
              <span className="font-mono-num font-medium text-ink-900">{formatMoney(customer.credit_limit)}</span>
            </div>
            {history && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700/60">Total Invoiced</span>
                  <span className="font-mono-num font-medium text-ink-900">{formatMoney(history.summary.totalInvoiced)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700/60">Total Paid</span>
                  <span className="font-mono-num font-medium text-accent-green">{formatMoney(history.summary.totalPaid)}</span>
                </div>
              </>
            )}
          </div>

          {customer.notes && (
            <div className="border-t border-surface-border pt-4 mt-4">
              <p className="text-xs font-semibold text-ink-700/50 mb-1">NOTES</p>
              <p className="text-sm text-ink-700/80">{customer.notes}</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <Card className="p-2">
            <div className="flex gap-1 p-1 overflow-x-auto scrollbar-thin">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.key ? 'bg-brand-700 text-white' : 'text-ink-700/60 hover:bg-surface-soft'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 mt-4">
            {tab === 'ledger' && <LedgerTable entries={history.ledger} />}
            {tab === 'invoices' && <InvoiceList items={history.invoices} customerId={id} />}
            {tab === 'quotations' && <QuotationList items={history.quotations} customerId={id} />}
            {tab === 'payments' && <PaymentList items={history.payments} />}
            {tab === 'documents' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <input ref={fileRef} type="file" hidden onChange={handleUpload} />
                  <Button size="sm" onClick={() => fileRef.current?.click()}><Upload size={14} /> Upload Document</Button>
                </div>
                {documents.length === 0 ? (
                  <EmptyState icon={Paperclip} title="No documents" description="Upload contracts, NTN certificates, or any file related to this customer." />
                ) : (
                  <div className="divide-y divide-surface-border">
                    {documents.map(d => (
                      <div key={d.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2 text-sm text-ink-800">
                          <Paperclip size={14} className="text-ink-700/40" /> {d.file_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={`${api.defaults.baseURL.replace('/api','')}${d.file_path}`} target="_blank" rel="noreferrer"
                            className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-700/60">
                            <Download size={14} />
                          </a>
                          <button onClick={() => handleDeleteDoc(d.id)} className="w-8 h-8 rounded-lg hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/60">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function LedgerTable({ entries }) {
  if (entries.length === 0) return <EmptyState icon={BookOpen} title="No ledger entries yet" description="Invoices, payments and adjustments will appear here automatically." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
            <th className="py-2 font-medium">Date</th>
            <th className="py-2 font-medium">Description</th>
            <th className="py-2 font-medium text-right">Debit</th>
            <th className="py-2 font-medium text-right">Credit</th>
            <th className="py-2 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {entries.map(e => (
            <tr key={e.id}>
              <td className="py-2.5 text-ink-700/70">{formatDate(e.entry_date)}</td>
              <td className="py-2.5 text-ink-800">{e.description || e.reference_type}</td>
              <td className="py-2.5 text-right font-mono-num text-accent-red">{e.type === 'debit' ? formatMoney(e.amount) : ''}</td>
              <td className="py-2.5 text-right font-mono-num text-accent-green">{e.type === 'credit' ? formatMoney(e.amount) : ''}</td>
              <td className="py-2.5 text-right font-mono-num font-semibold text-ink-900">{formatMoney(e.running_balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceList({ items }) {
  if (items.length === 0) return <EmptyState icon={Receipt} title="No invoices yet" description="Invoices for this customer will show up here." />;
  return (
    <div className="divide-y divide-surface-border">
      {items.map(inv => (
        <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between py-3 hover:bg-surface-soft/60 -mx-2 px-2 rounded-lg">
          <div>
            <p className="font-medium text-ink-900 text-sm">{inv.invoice_number}</p>
            <p className="text-xs text-ink-700/50">{formatDate(inv.date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'amber'}>{inv.status}</Badge>
            <span className="font-mono-num text-sm font-semibold w-24 text-right">{formatMoney(inv.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function QuotationList({ items }) {
  if (items.length === 0) return <EmptyState icon={FileText} title="No quotations yet" description="Quotations for this customer will show up here." />;
  return (
    <div className="divide-y divide-surface-border">
      {items.map(q => (
        <Link key={q.id} to={`/quotations/${q.id}`} className="flex items-center justify-between py-3 hover:bg-surface-soft/60 -mx-2 px-2 rounded-lg">
          <div>
            <p className="font-medium text-ink-900 text-sm">{q.quote_number}</p>
            <p className="text-xs text-ink-700/50">{formatDate(q.date)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={q.status === 'accepted' ? 'green' : q.status === 'rejected' ? 'red' : 'brand'}>{q.status}</Badge>
            <span className="font-mono-num text-sm font-semibold w-24 text-right">{formatMoney(q.total)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PaymentList({ items }) {
  if (items.length === 0) return <EmptyState icon={Wallet} title="No payments recorded yet" description="Payments received from this customer will show up here." />;
  return (
    <div className="divide-y divide-surface-border">
      {items.map(p => (
        <div key={p.id} className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-ink-900 text-sm">{p.payment_number}</p>
            <p className="text-xs text-ink-700/50 capitalize">{formatDate(p.date)} · {p.method}</p>
          </div>
          <span className="font-mono-num text-sm font-semibold text-accent-green">{formatMoney(p.amount)}</span>
        </div>
      ))}
    </div>
  );
}
