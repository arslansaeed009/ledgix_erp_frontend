import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FileText } from 'lucide-react';
import api from '../lib/api';
import { formatMoney, formatDate } from '../lib/format';
import { Card, Button, Select, Badge, EmptyState, Spinner } from '../components/ui';

const STATUS_TONE = { draft: 'gray', sent: 'brand', accepted: 'green', rejected: 'red', expired: 'amber', converted: 'green' };

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/quotations', { params: { search: search || undefined, status: status || undefined } })
      .then(res => setQuotations(res.data.quotations))
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Quotations</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/quotations/new"><Button><Plus size={16} /> New Quotation</Button></Link>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by quote # or customer…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40" />
        </div>
        <Select value={status} onChange={e => setStatus(e.target.value)} className="sm:w-48">
          <option value="">All Status</option>
          {['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'].map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : quotations.length === 0 ? (
          <EmptyState icon={FileText} title="No quotations yet" description="Create your first quotation for a customer."
            action={<Link to="/quotations/new"><Button><Plus size={16} /> New Quotation</Button></Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Quote #</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Valid Until</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {quotations.map(q => (
                  <tr key={q.id} onClick={() => navigate(`/quotations/${q.id}`)} className="hover:bg-surface-soft/60 cursor-pointer transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-900">{q.quote_number}</td>
                    <td className="px-5 py-3 text-ink-700/80">{q.customer_name}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(q.date)}</td>
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(q.validity_date)}</td>
                    <td className="px-5 py-3"><Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge></td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold">{formatMoney(q.total)}</td>
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
