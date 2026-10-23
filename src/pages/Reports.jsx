import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line
} from 'recharts';
import {
  Download, TrendingUp, Users, DollarSign, Package, ShoppingCart, Receipt,
  AlertCircle, Award, Wallet, RotateCcw, CalendarRange
} from 'lucide-react';
import api, { apiErrorMessage, authFileUrl } from '../lib/api';
import { formatMoney, formatDate } from '../lib/format';
import { CompanyPageHeading } from '../components/CompanyBrand';
import { Card, Button, Input } from '../components/ui';

const TABS = [
  { key: 'business-summary', label: 'Monthly Summary', icon: CalendarRange },
  { key: 'sales', label: 'Sales', icon: TrendingUp },
  { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'receiving', label: 'Receiving', icon: Wallet },
  { key: 'sales-returns', label: 'Sales Returns', icon: RotateCcw },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'profit', label: 'Profit', icon: DollarSign },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'stock', label: 'Stock', icon: Package },
  { key: 'tax', label: 'Tax / GST', icon: Award },
  { key: 'outstanding', label: 'Outstanding', icon: AlertCircle },
  { key: 'best-selling', label: 'Best Selling', icon: Award },
];

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function periodRange(preset) {
  const today = new Date();
  const end = iso(today);
  if (preset === 'daily') return { from: end, to: end };
  if (preset === 'weekly') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { from: iso(start), to: end };
  }
  if (preset === 'monthly') {
    return { from: `${end.slice(0, 7)}-01`, to: end };
  }
  if (preset === 'yearly') {
    return { from: `${today.getFullYear()}-01-01`, to: end };
  }
  return { from: '', to: '' };
}

export default function Reports() {
  const [tab, setTab] = useState('business-summary');
  const [data, setData] = useState(null);
  const [from, setFrom] = useState(() => periodRange('monthly').from);
  const [to, setTo] = useState(() => periodRange('monthly').to);
  const [preset, setPreset] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError('');
    api.get(`/reports/${tab}`, { params: { from: from || undefined, to: to || undefined } })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(apiErrorMessage(err, 'Could not load this report.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tab, from, to]);

  function applyPreset(key) {
    const range = periodRange(key);
    setPreset(key);
    setFrom(range.from);
    setTo(range.to);
  }

  function exportUrl() {
    const params = new URLSearchParams({ type: tab, from: from || '', to: to || '' });
    return authFileUrl(`/reports/export?${params.toString()}`);
  }

  const exportable = ['sales', 'customers', 'stock', 'outstanding', 'expenses'].includes(tab);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CompanyPageHeading
          title="Purchase & Business Reports"
          subtitle="Sales, purchases, receivings, returns, and monthly performance"
        />
        {exportable && (
          <a href={exportUrl()} target="_blank" rel="noreferrer">
            <Button variant="outline"><Download size={15} /> Export Excel</Button>
          </a>
        )}
      </div>

      <Card className="p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-brand-700 text-white' : 'text-ink-700/60 hover:bg-surface-soft'}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1.5 mr-2">
          {[
            ['daily', 'Daily'],
            ['weekly', 'Weekly'],
            ['monthly', 'Monthly'],
            ['yearly', 'Yearly'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                preset === key ? 'bg-brand-700 text-white' : 'bg-surface-soft text-ink-700/70 hover:bg-surface-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Input
          label="From date"
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }}
          className="w-44"
        />
        <Input
          label="To date"
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); setPreset('custom'); }}
          className="w-44"
        />
        {(from || to) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFrom(''); setTo(''); setPreset('custom'); }}
          >
            Clear
          </Button>
        )}
      </Card>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-ink-700/40">Loading…</div>
      ) : error ? (
        <Card className="p-6 text-center space-y-3">
          <p className="text-sm text-accent-red">{error}</p>
        </Card>
      ) : !data ? (
        <div className="h-64 flex items-center justify-center text-ink-700/40">No report data.</div>
      ) : (
        <>
          {tab === 'business-summary' && <BusinessSummaryReport data={data} from={from} to={to} />}
          {tab === 'sales' && <SalesReport data={data} />}
          {tab === 'purchases' && <PurchasesReport data={data} />}
          {tab === 'receiving' && <ReceivingReport data={data} />}
          {tab === 'sales-returns' && <SalesReturnsReport data={data} />}
          {tab === 'customers' && <CustomersReport data={data} />}
          {tab === 'profit' && <ProfitReport data={data} />}
          {tab === 'expenses' && <ExpensesReport data={data} />}
          {tab === 'stock' && <StockReport data={data} />}
          {tab === 'tax' && <TaxReport data={data} />}
          {tab === 'outstanding' && <OutstandingReport data={data} />}
          {tab === 'best-selling' && <BestSellingReport data={data} />}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass = tone === 'red' ? 'text-accent-red' : tone === 'green' ? 'text-accent-green' : tone === 'amber' ? 'text-accent-amber' : 'text-ink-900';
  return (
    <Card className="p-5">
      <p className="text-xs text-ink-700/50 mb-1">{label}</p>
      <p className={`font-mono-num font-bold text-xl ${toneClass}`}>{value}</p>
    </Card>
  );
}

function BusinessSummaryReport({ data, from, to }) {
  const t = data.totals || {};
  const inv = data.inventory || {};
  const p = data.performance || {};
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-display font-semibold text-lg text-ink-900">Monthly Business Summary</h3>
        <p className="text-sm text-ink-700/55 mt-1">
          Period: {from ? formatDate(from) : 'All time'} → {to ? formatDate(to) : 'All time'}
        </p>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Total Sales" value={formatMoney(t.totalSales)} />
        <SummaryCard label="Total Purchases" value={formatMoney(t.totalPurchases)} tone="amber" />
        <SummaryCard label="Total Receivings" value={formatMoney(t.totalReceivings)} tone="green" />
        <SummaryCard label="Total Sales Returns" value={formatMoney(t.totalSalesReturns)} tone="red" />
        <SummaryCard label="Net Sales (after returns)" value={formatMoney(t.netSales)} tone="green" />
        <SummaryCard label="Expenses" value={formatMoney(t.expenses)} />
        <SummaryCard label="Gross Margin (Net Sales − Purchases)" value={formatMoney(p.grossMargin)} />
        <SummaryCard label="Overall Performance" value={formatMoney(p.overall)} tone={p.overall >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Invoices" value={t.invoiceCount ?? 0} />
        <SummaryCard label="Purchase invoices" value={t.purchaseCount ?? 0} />
        <SummaryCard label="Receipts" value={t.receiptCount ?? 0} />
        <SummaryCard label="Return docs" value={t.returnCount ?? 0} />
      </div>

      <Card className="p-5">
        <h3 className="font-display font-semibold mb-4">Inventory Summary</h3>
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <div><p className="text-xs text-ink-700/50">Active SKUs</p><p className="font-mono-num font-bold text-lg">{inv.skuCount ?? 0}</p></div>
          <div><p className="text-xs text-ink-700/50">Total units</p><p className="font-mono-num font-bold text-lg">{inv.totalUnits ?? 0}</p></div>
          <div><p className="text-xs text-ink-700/50">Cost value</p><p className="font-mono-num font-bold text-lg">{formatMoney(inv.costValue)}</p></div>
          <div><p className="text-xs text-ink-700/50">Retail value</p><p className="font-mono-num font-bold text-lg">{formatMoney(inv.retailValue)}</p></div>
          <div><p className="text-xs text-ink-700/50">Low stock</p><p className="font-mono-num font-bold text-lg text-accent-amber">{inv.lowStockCount ?? 0}</p></div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display font-semibold mb-3">Performance ratios</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-ink-700/55">Purchase / Net Sales</p>
            <p className="font-mono-num font-bold text-lg mt-1">{((p.purchaseToSalesRatio || 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-ink-700/55">Return rate</p>
            <p className="font-mono-num font-bold text-lg mt-1">{((p.returnRate || 0) * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-xl bg-surface-soft px-4 py-3">
            <p className="text-ink-700/55">Cash proxy (Receipts − Purchases − Expenses)</p>
            <p className="font-mono-num font-bold text-lg mt-1">{formatMoney(p.cashPositionProxy)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SalesReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Sales</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.totals.totalSales)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Tax Collected</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.totals.totalTax)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Invoice Count</p><p className="font-mono-num font-bold text-xl">{data.totals.invoiceCount}</p></Card>
      </div>
      <Card className="p-5">
        <h3 className="font-display font-semibold mb-4">Sales Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.byDay}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9F1" />
            <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(d) => formatDate(d)} />
            <Line type="monotone" dataKey="total" stroke="#1565C0" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(data.invoices || []).map((i) => (
                <tr key={i.id}>
                  <td className="px-5 py-3 font-medium">{i.invoice_number}</td>
                  <td className="px-5 py-3">{i.customer_name}</td>
                  <td className="px-5 py-3 text-ink-700/70">{formatDate(i.date)}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PurchasesReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total purchase value</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.total)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total quantity purchased</p><p className="font-mono-num font-bold text-xl">{data.totalQty ?? 0}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Purchase invoices</p><p className="font-mono-num font-bold text-xl">{(data.purchaseInvoices || []).length}</p></Card>
      </div>

      {(data.byProduct || []).length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-surface-border">
            <h3 className="font-display font-semibold">Purchases by product</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {data.byProduct.map((row, idx) => (
                  <tr key={`${row.product_id || row.product_name}-${idx}`}>
                    <td className="px-5 py-3 font-medium">{row.product_name}</td>
                    <td className="px-5 py-3 text-right font-mono-num">{row.total_qty}</td>
                    <td className="px-5 py-3 text-right font-mono-num">{formatMoney(row.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-surface-border flex justify-between">
          <h3 className="font-display font-semibold">Purchase Invoices</h3>
          <p className="font-mono-num font-bold">{formatMoney(data.total)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Supplier</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(data.purchaseInvoices || []).map((pi) => (
                <tr key={pi.id}>
                  <td className="px-5 py-3 font-medium">{pi.purchase_invoice_number}</td>
                  <td className="px-5 py-3">{pi.supplier_name}</td>
                  <td className="px-5 py-3 text-ink-700/70">{formatDate(pi.date)}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(pi.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReceivingReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total receivings</p><p className="font-mono-num font-bold text-xl text-accent-green">{formatMoney(data.total)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Receipt count</p><p className="font-mono-num font-bold text-xl">{data.receiptCount ?? (data.payments || []).length}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Payment methods</p><p className="font-mono-num font-bold text-xl">{(data.byMethod || []).length}</p></Card>
      </div>

      {(data.byDay || []).length > 0 && (
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-4">Cash inflow trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9F1" />
              <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(d) => formatDate(d)} />
              <Bar dataKey="total" fill="#16A34A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-surface-border"><h3 className="font-display font-semibold">By method</h3></div>
          <div className="divide-y divide-surface-border">
            {(data.byMethod || []).map((m) => (
              <div key={m.method} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="capitalize font-medium">{m.method} · {m.count}</span>
                <span className="font-mono-num font-semibold">{formatMoney(m.total)}</span>
              </div>
            ))}
            {(data.byMethod || []).length === 0 && <p className="px-5 py-8 text-sm text-ink-700/50">No receipts in this period.</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 border-b border-surface-border"><h3 className="font-display font-semibold">Receipt detail</h3></div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3">Receipt #</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {(data.payments || []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{p.payment_number}</p>
                      <p className="text-xs text-ink-700/50">{formatDate(p.date)} · {p.method}</p>
                    </td>
                    <td className="px-5 py-3">{p.customer_name}</td>
                    <td className="px-5 py-3 text-right font-mono-num text-accent-green">{formatMoney(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SalesReturnsReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Return value</p><p className="font-mono-num font-bold text-xl text-accent-amber">{formatMoney(data.total)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Units returned</p><p className="font-mono-num font-bold text-xl">{data.totalQty ?? 0}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Return documents</p><p className="font-mono-num font-bold text-xl">{(data.salesReturns || []).length}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="px-5 py-3">Return #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(data.salesReturns || []).map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium">{r.return_number}</td>
                  <td className="px-5 py-3">{r.customer_name}</td>
                  <td className="px-5 py-3 text-ink-700/70">{r.invoice_number || '—'}</td>
                  <td className="px-5 py-3 text-ink-700/70">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CustomersReport({ data }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3 text-right">Business</th>
              <th className="px-5 py-3 text-right">Paid</th>
              <th className="px-5 py-3 text-right">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {(data.customers || []).map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-right font-mono-num">{formatMoney(c.total_business)}</td>
                <td className="px-5 py-3 text-right font-mono-num text-accent-green">{formatMoney(c.total_paid)}</td>
                <td className="px-5 py-3 text-right font-mono-num text-accent-red">{formatMoney(c.total_pending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ProfitReport({ data }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Revenue</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.revenue)}</p></Card>
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">COGS</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.cost)}</p></Card>
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Expenses</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.expenses)}</p></Card>
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Gross Profit</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.grossProfit)}</p></Card>
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Net Profit</p><p className={`font-mono-num font-bold text-xl ${data.netProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>{formatMoney(data.netProfit)}</p></Card>
    </div>
  );
}

function ExpensesReport({ data }) {
  return (
    <div className="space-y-5">
      <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Expenses</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.total)}</p></Card>
      <Card className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.byCategory}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9F1" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => formatMoney(v)} />
            <Bar dataKey="total" fill="#D97706" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function StockReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Stock Valuation (Cost)</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.valuation)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Stock Value (Retail)</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.retailValue)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Low Stock Items</p><p className="font-mono-num font-bold text-xl text-accent-amber">{data.lowStockCount}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(data.products || []).map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 text-ink-700/70">{p.category_name || '—'}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{p.stock_qty}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(p.stock_qty * p.purchase_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TaxReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Taxable Sales</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.totalSales)}</p></Card>
        <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Tax Collected</p><p className="font-mono-num font-bold text-xl">{formatMoney(data.totalTax)}</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3 text-right">Subtotal</th>
                <th className="px-5 py-3 text-right">Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(data.invoices || []).map((i) => (
                <tr key={i.invoice_number}>
                  <td className="px-5 py-3 font-medium">{i.invoice_number}</td>
                  <td className="px-5 py-3">{i.customer_name}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(i.subtotal)}</td>
                  <td className="px-5 py-3 text-right font-mono-num">{formatMoney(i.tax_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function OutstandingReport({ data }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-surface-border flex justify-between">
        <h3 className="font-display font-semibold">Outstanding Balances</h3>
        <p className="font-mono-num font-bold text-accent-red">{formatMoney(data.total)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {(data.customers || []).map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-ink-700/70">{c.phone}</td>
                <td className="px-5 py-3 text-right font-mono-num text-accent-red">{formatMoney(c.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BestSellingReport({ data }) {
  return (
    <Card className="p-5">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data.products || []} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v, n) => (n === 'total_qty' ? v : formatMoney(v))} />
          <Bar dataKey="total_qty" fill="#1565C0" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
