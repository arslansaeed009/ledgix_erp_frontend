import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Receipt } from 'lucide-react';
import api from '../lib/api';
import { formatMoney, formatDate } from '../lib/format';
import { Card, Button, Select, Badge, EmptyState, Spinner } from '../components/ui';

const STATUS_TONE = { pending: 'amber', partial: 'amber', paid: 'green', overdue: 'red', cancelled: 'gray' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [docType, setDocType] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/invoices', { params: { search: search || undefined, status: status || undefined } })
      .then(res => setInvoices(res.data.invoices))
      .finally(() => setLoading(false));
  }, [search, status]);

  const filtered = docType ? invoices.filter(i => (i.doc_type || 'invoice') === docType) : invoices;

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Invoices</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/invoices/new"><Button><Plus size={16} /> New Invoice</Button></Link>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by invoice # or customer…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40" />
        </div>
        <Select value={status} onChange={e => setStatus(e.target.value)} className="sm:w-48">
          <option value="">All Status</option>
          {['pending', 'partial', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={docType} onChange={e => setDocType(e.target.value)} className="sm:w-48">
          <option value="">Bills &amp; Invoices</option>
          <option value="bill">Bills only</option>
          <option value="invoice">Invoices only</option>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No bills or invoices yet" description="Create your first bill or invoice, or convert an accepted quotation."
            action={<Link to="/invoices/new"><Button><Plus size={16} /> New Invoice</Button></Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Number</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(inv => (
                  <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="hover:bg-surface-soft/60 cursor-pointer transition-colors">
                    <td className="px-5 py-3"><Badge tone={inv.doc_type === 'bill' ? 'gray' : 'brand'}>{inv.doc_type === 'bill' ? 'Bill' : 'Invoice'}</Badge></td>
                    <td className="px-5 py-3 font-medium text-ink-900">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-ink-700/80">{inv.customer_name}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(inv.date)}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3"><Badge tone={inv.is_overdue ? 'red' : STATUS_TONE[inv.status]}>{inv.is_overdue ? 'overdue' : inv.status}</Badge></td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold">{formatMoney(inv.total)}</td>
                    <td className={`px-5 py-3 text-right font-mono-num font-semibold ${inv.balance > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{formatMoney(inv.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
