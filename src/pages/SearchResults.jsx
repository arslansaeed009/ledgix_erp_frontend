import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, Package, Receipt, FileText, Wallet, Truck, SearchX } from 'lucide-react';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { Card, Badge, Spinner } from '../components/ui';

const SECTIONS = [
  { key: 'customers', label: 'Customers', icon: Users, path: id => `/customers/${id}`, render: c => ({ title: c.name, sub: c.company || c.phone }) },
  { key: 'products', label: 'Products', icon: Package, path: id => `/products/${id}`, render: p => ({ title: p.name, sub: p.sku || p.brand }) },
  { key: 'invoices', label: 'Invoices', icon: Receipt, path: id => `/invoices/${id}`, render: i => ({ title: i.invoice_number, sub: i.customer_name, amount: i.total, status: i.status }) },
  { key: 'quotations', label: 'Quotations', icon: FileText, path: id => `/quotations/${id}`, render: q => ({ title: q.quote_number, sub: q.customer_name, amount: q.total, status: q.status }) },
  { key: 'payments', label: 'Payments', icon: Wallet, path: id => null, render: p => ({ title: p.payment_number, sub: p.customer_name, amount: p.amount }) },
  { key: 'suppliers', label: 'Suppliers', icon: Truck, path: id => `/suppliers/${id}`, render: s => ({ title: s.name, sub: s.company || s.phone }) },
];

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!q) { setResults(null); setLoading(false); return; }
    setLoading(true);
    api.get('/search', { params: { q } }).then(res => setResults(res.data)).finally(() => setLoading(false));
  }, [q]);

  const totalResults = results ? Object.values(results).reduce((s, arr) => s + arr.length, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Search Results</h1>
        <p className="text-sm text-ink-700/60 mt-0.5">"{q}"{results && ` — ${totalResults} result${totalResults !== 1 ? 's' : ''}`}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
      ) : totalResults === 0 ? (
        <Card className="p-12 flex flex-col items-center text-center">
          <SearchX size={28} className="text-ink-700/30 mb-3" />
          <p className="font-medium text-ink-900">No results found</p>
          <p className="text-sm text-ink-700/60 mt-1">Try a different name, number, or keyword.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {SECTIONS.map(section => {
            const items = results[section.key] || [];
            if (items.length === 0) return null;
            return (
              <Card key={section.key} className="p-5">
                <h3 className="font-display font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <section.icon size={16} className="text-brand-700" /> {section.label} ({items.length})
                </h3>
                <div className="divide-y divide-surface-border">
                  {items.map(item => {
                    const { title, sub, amount, status } = section.render(item);
                    const path = section.path(item.id);
                    return (
                      <div key={item.id} onClick={() => path && navigate(path)} className={`flex items-center justify-between py-2.5 ${path ? 'cursor-pointer hover:bg-surface-soft/60 -mx-2 px-2 rounded-lg' : ''}`}>
                        <div>
                          <p className="text-sm font-medium text-ink-900">{title}</p>
                          {sub && <p className="text-xs text-ink-700/50">{sub}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {status && <Badge tone="brand">{status}</Badge>}
                          {amount !== undefined && <span className="font-mono-num text-sm font-semibold">{formatMoney(amount)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
