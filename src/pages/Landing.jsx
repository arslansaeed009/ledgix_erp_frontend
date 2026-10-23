import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  FileText,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import logo from '../assets/logo.png';

const features = [
  {
    icon: FileText,
    title: 'Sales, made simple',
    description: 'Create quotations and invoices, record payments, and keep every customer conversation in context.',
  },
  {
    icon: Boxes,
    title: 'Inventory in control',
    description: 'Track products, purchases, suppliers, and stock levels from one connected workspace.',
  },
  {
    icon: BarChart3,
    title: 'Know your numbers',
    description: 'See sales, expenses, outstanding balances, and business performance at a glance.',
  },
];

const modules = [
  { icon: FileText, label: 'Invoices' },
  { icon: Package, label: 'Inventory' },
  { icon: ShoppingCart, label: 'Purchases' },
  { icon: Wallet, label: 'Ledger' },
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[570px]">
      <div className="absolute -inset-8 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_30px_100px_-35px_rgba(15,26,46,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <BarChart3 size={17} />
            </span>
            <span className="font-display text-sm font-bold text-ink-900">Business overview</span>
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-700">
            Sample data
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {[
            ['Monthly sales', '$24,680', '+12.8%'],
            ['Collected', '$18,240', '+8.2%'],
            ['Outstanding', '$6,440', '12 invoices'],
            ['Products', '248', 'In catalogue'],
          ].map(([label, value, note], index) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="text-[10px] font-medium text-slate-500">{label}</p>
              <p className="mt-1 font-display text-base font-bold tracking-tight text-ink-900">{value}</p>
              <p className={`mt-1 text-[9px] font-semibold ${index === 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {note}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink-900">Sales performance</p>
                <p className="mt-1 text-[10px] text-slate-400">Your business, month by month</p>
              </div>
              <span className="text-[10px] font-medium text-slate-400">This year</span>
            </div>
            <div className="mt-5 flex h-[92px] items-end gap-2">
              {[34, 48, 40, 66, 51, 78, 59, 88, 70, 96, 74, 100].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-sm bg-brand-100" style={{ height: `${height}%` }}>
                  <div className="h-[65%] rounded-t-sm bg-brand-500" />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[9px] text-slate-400">
              <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>DEC</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-ink-900">Recent activity</p>
            <div className="mt-3 space-y-3">
              {[
                ['Invoice paid', 'Northstar Supplies', '$1,240'],
                ['New purchase', 'Metro Wholesale', '$860'],
                ['New customer', 'Olive & Oak Cafe', 'Added today'],
              ].map(([title, subtitle, amount], index) => (
                <div key={title} className="flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${index === 1 ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-700'}`}>
                    {index === 1 ? <ShoppingCart size={13} /> : <FileText size={13} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-slate-700">{title}</p>
                    <p className="truncate text-[9px] text-slate-400">{subtitle}</p>
                  </div>
                  <span className="whitespace-nowrap text-[9px] font-semibold text-slate-600">{amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-card sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Check size={18} /></span>
        <div><p className="text-xs font-semibold text-ink-900">Everything in sync</p><p className="mt-0.5 text-[10px] text-slate-400">One clear view of your business</p></div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-ink-900">
      <header className="relative z-10 border-b border-slate-100 bg-white/90">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" aria-label="Ledgix home" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-10 w-10 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">Ledgix<span className="text-brand-700">.</span></span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-brand-700">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-brand-700">Why Ledgix</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-brand-700 sm:inline-flex">Sign in</Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800">
              Get started <ArrowRight size={15} />
            </Link>
            <a href="#features" aria-label="Explore features" className="ml-1 inline-flex text-slate-600 md:hidden"><Menu size={21} /></a>
          </div>
        </nav>
      </header>

      <section className="relative isolate">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_35%,rgba(46,123,214,0.11),transparent_45%),linear-gradient(to_bottom,#fff,#f8fbff)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-12 lg:py-24">
          <div className="max-w-xl animate-fadeUp">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              A clearer way to run your business
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.12] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.65rem]">
              Your whole business, <span className="text-brand-700">working together.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Bring sales, inventory, purchases, and finances into one straightforward workspace. Spend less time chasing numbers and more time moving forward.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(21,101,192,0.7)] transition hover:-translate-y-0.5 hover:bg-brand-800">
                Access your workspace <ArrowRight size={17} />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-brand-100 hover:text-brand-700">
                Explore features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-600" /> Access for your team</span>
              <span className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-600" /> Built for everyday business</span>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="features" className="scroll-mt-10 border-y border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">One connected workspace</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">The essentials to keep business moving</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">The day-to-day tools you need, together in one place and easy to find.</p>
          </div>
          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6 transition hover:-translate-y-1 hover:border-brand-100 hover:bg-white hover:shadow-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={21} /></span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-10 bg-slate-50/80 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Less switching, more clarity</p>
            <h2 className="mt-3 max-w-lg font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">A better handle on the details that matter.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">From your first quotation to the latest payment, Ledgix keeps your everyday operations connected, so you can see what needs attention and keep work flowing.</p>
            <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Sign in to your workspace <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {modules.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Icon size={19} /></span>
                <span className="text-sm font-semibold text-ink-900">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-2xl bg-ink-900 px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10 sm:py-10">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Ready to get to work?</h2>
            <p className="mt-2 text-sm text-white/65">Sign in to your Ledgix workspace and pick up where you left off.</p>
          </div>
          <Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-brand-50">
            Sign in <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-7 w-7 object-contain" />
            <span className="font-display text-sm font-bold">Ledgix</span>
          </Link>
          <p className="text-center text-xs text-slate-500">Business management, thoughtfully brought together.</p>
          <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-brand-700">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
