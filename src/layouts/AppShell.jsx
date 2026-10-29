import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, Receipt, Wallet, BookOpen,
  Wrench, Truck, BarChart3, Settings, Search, Bell, ChevronLeft, ChevronRight,
  Plus, LogOut, AlertTriangle, Clock, FileClock, Sun, Moon, ShoppingCart, RotateCcw
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useCompany } from '../lib/CompanyContext';
import defaultLogo from '../assets/logo.png';
import api from '../lib/api';
import { getStoredTheme, applyTheme, subscribeTheme } from '../lib/theme';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pos', label: 'POS / New Sale', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/sales-returns', label: 'Sales Returns', icon: RotateCcw },
  { to: '/ledger', label: 'Ledger', icon: BookOpen },
  { to: '/expenses', label: 'Expenses', icon: Wrench },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const { companyName, tagline, logoUrl } = useCompany();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-soft flex">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-[76px]' : 'w-[248px]'} shrink-0 bg-ink-950 text-white/90 flex flex-col transition-all duration-300 ease-out sticky top-0 h-screen`}
      >
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-white/10 min-h-[4rem]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={companyName || 'Company logo'}
              className="w-8 h-8 rounded-lg object-contain bg-white/10 shrink-0"
            />
          ) : (
            <img src={defaultLogo} alt="Ledgix" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          )}
          {!collapsed && (companyName || tagline || !logoUrl) ? (
            <div className="leading-tight overflow-hidden min-w-0">
              {companyName || !logoUrl ? (
                <p className="font-display font-bold text-sm tracking-wide whitespace-nowrap truncate">{companyName || 'Ledgix'}</p>
              ) : null}
              {tagline ? (
                <p className="text-[10px] text-white/45 whitespace-nowrap truncate">{tagline}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'bg-brand-700 text-white shadow-card'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(v => !v)}
          className="m-2 flex items-center justify-center gap-2 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-xs"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
        </button>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-20 glass border-b border-surface-border flex items-center gap-4 px-6">
          <div className="flex-1 max-w-xl relative">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              placeholder="Search customers, invoices, products, quotations…"
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-muted border border-transparent focus:border-brand-300 focus:bg-surface text-ink-900 placeholder:text-ink-700/40 text-sm outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <QuickActions />
            <ThemeToggle />
            <NotificationBell />
            <div className="w-px h-8 bg-surface-border mx-1" />
            <div className="flex items-center gap-2 pr-1">
              <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold font-display">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              {!collapsed && (
                <div className="hidden lg:block leading-tight">
                  <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="text-xs text-ink-700/50">{user?.role}</p>
                </div>
              )}
              <button
                onClick={() => { logout(); navigate('/login'); }}
                title="Log out"
                className="ml-1 w-9 h-9 rounded-xl hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/60"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto animate-fadeUp">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme());

  useEffect(() => subscribeTheme(setTheme), []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  return (
    <button onClick={toggle} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-10 h-10 rounded-xl hover:bg-surface-muted flex items-center justify-center text-ink-700">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  function toggle() {
    if (!open && !loaded) {
      api.get('/notifications').then(res => { setNotifications(res.data.notifications); setLoaded(true); });
    }
    setOpen(v => !v);
  }

  const icons = { payment_due: Clock, low_stock: AlertTriangle, quotation_expiry: FileClock };

  return (
    <div className="relative">
      <button onClick={toggle} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="relative w-10 h-10 rounded-xl hover:bg-surface-muted flex items-center justify-center text-ink-700">
        <Bell size={18} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-red" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto scrollbar-thin bg-surface rounded-xl shadow-cardHover border border-surface-border py-2 z-30">
          <p className="px-4 py-1.5 text-xs font-semibold text-ink-700/60 uppercase">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-700/60 text-center">You're all caught up.</p>
          ) : (
            notifications.map((n, i) => {
              const Icon = icons[n.type] || Bell;
              return (
                <button key={i} onClick={() => { navigate(n.link); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface-soft flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${n.severity === 'high' ? 'bg-accent-redLight text-accent-red' : 'bg-accent-amberLight text-accent-amber'}`}>
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{n.title}</p>
                    <p className="text-xs text-ink-700/60">{n.message}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function QuickActions() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const actions = [
    { label: 'POS / New Sale', to: '/pos' },
    { label: 'New Invoice', to: '/invoices/new' },
    { label: 'New Quotation', to: '/quotations/new' },
    { label: 'Receive Payment', to: '/payments?new=1' },
    { label: 'Add Customer', to: '/customers?new=1' },
  ];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-10 px-3.5 rounded-xl bg-brand-700 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-brand-800 transition-colors shadow-card"
      >
        <Plus size={16} /> <span className="hidden sm:inline">Quick Action</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-surface rounded-xl shadow-cardHover border border-surface-border py-1.5 z-30">
          {actions.map(a => (
            <button
              key={a.to}
              onClick={() => { navigate(a.to); setOpen(false); }}
              className="w-full text-left px-3.5 py-2 text-sm text-ink-800 hover:bg-surface-soft"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
