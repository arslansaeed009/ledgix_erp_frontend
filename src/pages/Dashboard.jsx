import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Wallet, TrendingUp, Clock, Users, FileText, Receipt, Package,
  AlertTriangle, Plus, ArrowUpRight, ArrowRight, Sparkles, CalendarDays,
  CircleDollarSign, ShoppingBag, Truck, ShoppingCart
} from 'lucide-react';
import api from '../lib/api';
import { formatMoney, formatDate } from '../lib/format';
import { CompanyPageHeading } from '../components/CompanyBrand';
import { Card, StatCard, Badge, Button, Spinner } from '../components/ui';

const PIE_COLORS = ['#1565C0', '#16A34A', '#D97706', '#DC2626', '#7FADE8'];
const CHART_TICK = { fontSize: 11, fill: 'rgb(var(--ink-700))' };
const CHART_TOOLTIP = {
  background: 'rgb(var(--surface))',
  border: '1px solid rgb(var(--surface-border))',
  borderRadius: 12,
  color: 'rgb(var(--ink-900))',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  const paymentTotal = useMemo(() => {
    if (!data?.paymentStatus?.length) return 0;
    return data.paymentStatus.reduce((s, p) => s + Number(p.total || 0), 0);
  }, [data]);

  const maxCustomer = useMemo(() => {
    if (!data?.topCustomers?.length) return 1;
    return Math.max(...data.topCustomers.map(c => Number(c.total_business || 0)), 1);
  }, [data]);

  const maxSupplier = useMemo(() => {
    if (!data?.topSuppliers?.length) return 1;
    return Math.max(...data.topSuppliers.map(s => Number(s.total_purchases || 0)), 1);
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-brand-700">
        <Spinner size={32} />
        <p className="text-sm text-ink-700/50 font-medium">Loading dashboard…</p>
      </div>
    );
  }

  const {
    kpis, recentTransactions, recentPurchases = [], topSuppliers = [], salesGraph, topCustomers, topProducts,
    paymentStatus, profitSummary, lowStock, upcomingFollowUps = [],
  } = data;
  const isEmpty = kpis.totalCustomers === 0 && kpis.activeInvoices === 0 && kpis.totalProducts === 0;

  return (
    <div className="space-y-7 font-body">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface p-6 sm:p-7 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(21,101,192,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(22,163,74,0.08),_transparent_50%)]" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-700/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <CompanyPageHeading
            title="Dashboard"
            subtitle={`Live business overview · ${formatDate(new Date())}`}
          />
          <div className="flex flex-wrap gap-2">
            <Link to="/suppliers">
              <Button variant="outline" size="sm" className="shadow-sm">
                <Plus size={15} /> Supplier
              </Button>
            </Link>
            <Link to="/customers?new=1">
              <Button variant="outline" size="sm" className="shadow-sm">
                <Plus size={15} /> Customer
              </Button>
            </Link>
            <Link to="/invoices/new">
              <Button size="sm" className="shadow-sm">
                <Plus size={15} /> Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {isEmpty && (
        <Card className="p-6 border-brand-100 bg-gradient-to-r from-brand-50/90 via-surface to-accent-greenLight/30 flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center shrink-0 shadow-card">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-body font-semibold text-ink-900 text-lg">Your workspace is ready</p>
            <p className="text-sm text-ink-700/65 mt-0.5">
              Configure branding in Settings, then add a customer and product to populate live KPIs.
            </p>
          </div>
          <Link to="/settings" className="ml-auto hidden sm:block shrink-0">
            <Button variant="outline" size="sm">Open Settings <ArrowRight size={14} /></Button>
          </Link>
        </Card>
      )}

      {/* Primary KPIs */}
      <section className="space-y-3">
        <SectionLabel icon={CircleDollarSign} title="Key performance" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Today's Sales" value={formatMoney(kpis.todaysSales)} icon={TrendingUp} tone="brand" />
          <StatCard label="Monthly Sales" value={formatMoney(kpis.monthlySales)} icon={ShoppingBag} tone="brand" />
          <StatCard label="Today's Collection" value={formatMoney(kpis.todaysCollection)} icon={Wallet} tone="green" />
          <StatCard label="Outstanding" value={formatMoney(kpis.outstandingBalance)} icon={Clock} tone="red" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Customers" value={kpis.totalCustomers} icon={Users} tone="ink" />
          <StatCard label="Quotations" value={kpis.activeQuotations} icon={FileText} tone="amber" />
          <StatCard label="Active Invoices" value={kpis.activeInvoices} icon={Receipt} tone="brand" />
          <StatCard label="Products" value={kpis.totalProducts} icon={Package} tone="ink" />
        </div>
      </section>

      {/* Purchases */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel icon={ShoppingCart} title="Purchases" />
          <Link to="/suppliers" className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
            Manage suppliers <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Today's Purchases" value={formatMoney(kpis.todaysPurchases || 0)} icon={ShoppingCart} tone="amber" />
          <StatCard label="Monthly Purchases" value={formatMoney(kpis.monthlyPurchases || 0)} icon={Truck} tone="amber" />
          <StatCard label="Payable to Suppliers" value={formatMoney(kpis.purchasePayable || 0)} icon={Clock} tone="red" />
          <StatCard label="Suppliers" value={kpis.totalSuppliers || 0} icon={Truck} tone="ink" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="p-6 lg:col-span-2 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-body font-semibold text-lg text-ink-900">Recent purchases</h3>
                <p className="text-xs text-ink-700/55 mt-0.5">
                  Latest supplier invoices
                  {(kpis.pendingPurchaseInvoices || 0) > 0 ? ` · ${kpis.pendingPurchaseInvoices} unpaid` : ''}
                  {(kpis.openPurchaseOrders || 0) > 0 ? ` · ${kpis.openPurchaseOrders} open POs` : ''}
                </p>
              </div>
              <Link to="/suppliers" className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {recentPurchases.length === 0 ? (
              <EmptyChart text="Purchase invoices will appear here once you buy from suppliers." />
            ) : (
              <div className="space-y-1">
                {recentPurchases.map((p) => (
                  <Link
                    key={p.id}
                    to={`/suppliers/${p.supplier_id}`}
                    className="flex items-center justify-between py-3 px-3 -mx-1 rounded-2xl hover:bg-surface-soft/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-accent-amberLight text-accent-amber ring-1 ring-black/5 dark:ring-white/10">
                        <ShoppingCart size={16} strokeWidth={2.1} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">{p.ref}</p>
                        <p className="text-xs text-ink-700/50 mt-0.5 truncate">
                          {p.supplier_name} · {formatDate(p.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono-num text-sm font-bold text-ink-900">{formatMoney(p.amount)}</p>
                      <Badge tone={p.status === 'paid' ? 'green' : p.status === 'partial' ? 'amber' : 'red'}>
                        {p.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6 shadow-card">
            <div className="mb-5">
              <h3 className="font-body font-semibold text-lg text-ink-900">Top suppliers</h3>
              <p className="text-xs text-ink-700/55 mt-0.5">By purchase value</p>
            </div>
            {topSuppliers.length === 0 ? (
              <EmptyChart text="No purchases recorded yet." small />
            ) : (
              <div className="space-y-4">
                {topSuppliers.map((s, i) => {
                  const pct = Math.max(6, Math.round((Number(s.total_purchases || 0) / maxSupplier) * 100));
                  return (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          i === 0 ? 'bg-accent-amber text-white' : 'bg-surface-muted text-ink-700'
                        }`}>{i + 1}</span>
                        <Link to={`/suppliers/${s.id}`} className="flex-1 text-sm font-semibold text-ink-800 hover:text-brand-700 truncate">
                          {s.name}
                        </Link>
                        <span className="font-mono-num text-sm font-bold text-ink-900 shrink-0">{formatMoney(s.total_purchases)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden ml-10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-amber to-amber-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2 shadow-card hover:shadow-cardHover transition-shadow duration-300">
          <div className="flex items-center justify-between mb-5 gap-3">
            <div>
              <h3 className="font-body font-semibold text-lg text-ink-900">Sales trend</h3>
              <p className="text-xs text-ink-700/55 mt-0.5">Last 30 days · invoiced totals</p>
            </div>
            <Link to="/reports" className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              Full report <ArrowRight size={12} />
            </Link>
          </div>
          {salesGraph.length === 0 ? (
            <EmptyChart text="No invoices yet. Sales trend will appear here once you start billing." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesGraph} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1565C0" stopOpacity={0.38} />
                    <stop offset="55%" stopColor="#1565C0" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#1565C0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="rgb(var(--surface-border))" />
                <XAxis dataKey="date" tickFormatter={d => formatDate(d)} tick={CHART_TICK} axisLine={false} tickLine={false} dy={6} />
                <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} width={48} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP}
                  labelStyle={{ color: 'rgb(var(--ink-700))', fontSize: 12, marginBottom: 4 }}
                  formatter={(v) => [formatMoney(v), 'Sales']}
                  labelFormatter={(d) => formatDate(d)}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#1565C0"
                  strokeWidth={2.5}
                  fill="url(#salesFill)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6 shadow-card hover:shadow-cardHover transition-shadow duration-300 flex flex-col h-full">
          <div className="mb-4 shrink-0">
            <h3 className="font-body font-semibold text-lg text-ink-900">Payment mix</h3>
            <p className="text-xs text-ink-700/55 mt-0.5">Invoice status breakdown</p>
          </div>
          {paymentStatus.length === 0 ? (
            <EmptyChart text="No invoices yet." small />
          ) : (
            <>
              <div className="flex-1 flex flex-col items-center justify-center py-2 gap-3">
                <div className="text-center shrink-0">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-ink-700/50 leading-none">Total</p>
                  <p className="font-mono-num text-base font-bold text-ink-900 mt-1 leading-tight">
                    {formatMoney(paymentTotal)}
                  </p>
                </div>
                <div className="w-[180px] h-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatus}
                        dataKey="total"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={72}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {paymentStatus.map((entry, i) => (
                          <Cell key={entry.status} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-surface-border grid grid-cols-[auto_minmax(0,1fr)_2.75rem_minmax(4.5rem,auto)] gap-x-2 gap-y-2.5 items-center">
                {paymentStatus.map((s, i) => {
                  const pct = paymentTotal ? Math.round((Number(s.total) / paymentTotal) * 100) : 0;
                  return (
                    <div key={s.status} className="contents text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-surface"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-ink-700/75 capitalize truncate">{s.status}</span>
                      <span className="text-ink-700/40 text-right tabular-nums">{pct}%</span>
                      <span className="font-mono-num font-semibold text-ink-900 text-right">{formatMoney(s.total)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Activity + profit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-2 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-body font-semibold text-lg text-ink-900">Recent activity</h3>
              <p className="text-xs text-ink-700/55 mt-0.5">Latest invoices and payments</p>
            </div>
            <Link to="/invoices" className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <EmptyChart text="Invoices and payments will show up here as you create them." />
          ) : (
            <div className="space-y-1">
              {recentTransactions.map(t => (
                <div
                  key={`${t.type}-${t.id}`}
                  className="flex items-center justify-between py-3 px-3 -mx-1 rounded-2xl hover:bg-surface-soft/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/10 ${
                      t.type === 'invoice'
                        ? 'bg-brand-50 text-brand-700 dark:text-brand-300'
                        : 'bg-accent-greenLight text-accent-green'
                    }`}>
                      {t.type === 'invoice' ? <Receipt size={16} strokeWidth={2.1} /> : <Wallet size={16} strokeWidth={2.1} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{t.ref}</p>
                      <p className="text-xs text-ink-700/50 mt-0.5 capitalize">{t.type} · {formatDate(t.date)}</p>
                    </div>
                  </div>
                  <p className={`font-mono-num text-sm font-bold shrink-0 ml-3 ${t.type === 'payment' ? 'text-accent-green' : 'text-ink-900'}`}>
                    {t.type === 'payment' ? '+' : ''}{formatMoney(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-6 shadow-card overflow-hidden relative">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent-green/10 blur-2xl" />
            <h3 className="font-body font-semibold text-lg text-ink-900 mb-4 relative">Profit snapshot</h3>
            <div className="space-y-3 text-sm relative">
              <Row label="Revenue" value={formatMoney(profitSummary.revenue)} />
              <Row label="Cost of goods" value={formatMoney(profitSummary.cost)} />
              <Row label="Expenses" value={formatMoney(profitSummary.expenses)} />
              <div className="rounded-2xl bg-surface-soft border border-surface-border px-3.5 py-3 mt-2">
                <Row
                  label="Net Profit"
                  value={formatMoney(profitSummary.profit)}
                  bold
                  tone={profitSummary.profit >= 0 ? 'green' : 'red'}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-body font-semibold text-lg text-ink-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-accent-amberLight text-accent-amber flex items-center justify-center">
                <AlertTriangle size={15} />
              </span>
              Low stock
            </h3>
            {lowStock.length === 0 ? (
              <p className="text-sm text-ink-700/55 py-2">All products are above reorder level.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStock.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm rounded-xl px-2.5 py-2 bg-surface-soft/70">
                    <span className="text-ink-800 font-medium truncate">{p.name}</span>
                    <Badge tone="red">{p.stock_qty} left</Badge>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <Link to="/inventory" className="text-xs font-semibold text-brand-700 inline-flex items-center gap-1 pt-1">
                    +{lowStock.length - 5} more <ArrowRight size={11} />
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-body font-semibold text-lg text-ink-900">Top customers</h3>
              <p className="text-xs text-ink-700/55 mt-0.5">By total business value</p>
            </div>
            <Link to="/customers" className="text-xs font-semibold text-brand-700 hover:text-brand-800 inline-flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          {topCustomers.length === 0 ? (
            <EmptyChart text="No sales recorded yet." small />
          ) : (
            <div className="space-y-4">
              {topCustomers.map((c, i) => {
                const pct = Math.max(6, Math.round((Number(c.total_business || 0) / maxCustomer) * 100));
                return (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-brand-700 text-white' : 'bg-surface-muted text-ink-700'
                      }`}>{i + 1}</span>
                      <Link to={`/customers/${c.id}`} className="flex-1 text-sm font-semibold text-ink-800 hover:text-brand-700 truncate">
                        {c.name}
                      </Link>
                      <span className="font-mono-num text-sm font-bold text-ink-900 shrink-0">{formatMoney(c.total_business)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden ml-10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-card">
          <div className="mb-5">
            <h3 className="font-body font-semibold text-lg text-ink-900">Top selling products</h3>
            <p className="text-xs text-ink-700/55 mt-0.5">Units sold</p>
          </div>
          {topProducts.length === 0 ? (
            <EmptyChart text="No sales recorded yet." small />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#124F98" />
                    <stop offset="100%" stopColor="#2E7BD6" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={118} tick={CHART_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`${v} units`, 'Sold']} />
                <Bar dataKey="total_qty" fill="url(#barFill)" radius={[0, 8, 8, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {upcomingFollowUps?.length > 0 && (
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 dark:text-brand-300 flex items-center justify-center">
              <CalendarDays size={15} />
            </span>
            <div>
              <h3 className="font-body font-semibold text-lg text-ink-900">Upcoming follow-ups</h3>
              <p className="text-xs text-ink-700/55">Customer reminders on your radar</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingFollowUps.slice(0, 6).map((f, i) => (
              <div key={i} className="rounded-2xl border border-surface-border bg-surface-soft/60 px-4 py-3">
                <p className="text-sm font-semibold text-ink-900 truncate">{f.customer_name || f.title || 'Follow-up'}</p>
                <p className="text-xs text-ink-700/55 mt-1">{formatDate(f.date || f.follow_up_date)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SectionLabel({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 px-0.5">
      <Icon size={14} className="text-brand-700 dark:text-brand-300" strokeWidth={2.2} />
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-700/50">{title}</h2>
    </div>
  );
}

function Row({ label, value, bold, tone }) {
  const toneClass = tone === 'green' ? 'text-accent-green' : tone === 'red' ? 'text-accent-red' : 'text-ink-900';
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-ink-700/70 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`font-mono-num ${bold ? 'font-bold text-base' : 'font-medium'} ${toneClass}`}>{value}</span>
    </div>
  );
}

function EmptyChart({ text, small }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center gap-2 rounded-2xl border border-dashed border-surface-border bg-surface-soft/40 px-6 ${small ? 'h-28' : 'h-56'}`}>
      <ArrowUpRight size={18} className="text-ink-700/35" />
      <p className="text-sm text-ink-700/55 max-w-sm">{text}</p>
    </div>
  );
}
