import { forwardRef } from 'react';
import { X } from 'lucide-react';

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-surface rounded-2xl border border-surface-border shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props }, ref
) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-card',
    secondary: 'bg-surface-muted text-ink-800 hover:bg-surface-border',
    ghost: 'text-ink-700 hover:bg-surface-muted',
    danger: 'bg-accent-red text-white hover:bg-red-700',
    outline: 'border border-surface-border text-ink-800 hover:bg-surface-soft',
  };
  return (
    <button ref={ref} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
});

export function Badge({ tone = 'gray', children, className = '' }) {
  const tones = {
    gray: 'bg-surface-muted text-ink-800',
    green: 'bg-accent-greenLight text-accent-green',
    red: 'bg-accent-redLight text-accent-red',
    amber: 'bg-accent-amberLight text-accent-amber',
    brand: 'bg-brand-50 text-brand-700 dark:text-brand-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

const fieldClass =
  'w-full rounded-xl bg-surface-soft border border-surface-border text-ink-900 placeholder:text-ink-700/40 focus:border-brand-500 focus:bg-surface outline-none text-sm transition-colors';

export const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink-700/80 mb-1.5">{label}</span>}
      <input
        ref={ref}
        className={`h-10 px-3 ${fieldClass} ${error ? 'border-accent-red' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-accent-red mt-1 block">{error}</span>}
    </label>
  );
});

export const Select = forwardRef(function Select({ label, error, className = '', children, ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink-700/80 mb-1.5">{label}</span>}
      <select
        ref={ref}
        className={`h-10 px-3 ${fieldClass} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-accent-red mt-1 block">{error}</span>}
    </label>
  );
});

export const Textarea = forwardRef(function Textarea({ label, className = '', ...props }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-semibold text-ink-700/80 mb-1.5">{label}</span>}
      <textarea
        ref={ref}
        className={`px-3 py-2 ${fieldClass} ${className}`}
        {...props}
      />
    </label>
  );
});

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl shadow-cardHover w-full ${width} max-h-[90vh] overflow-y-auto scrollbar-thin animate-fadeUp border border-surface-border`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-surface rounded-t-2xl">
          <h3 className="font-display font-semibold text-lg text-ink-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-700/70">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 text-ink-900">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 dark:text-brand-300 flex items-center justify-center mb-4">
          <Icon size={24} />
        </div>
      )}
      <h3 className="font-display font-semibold text-ink-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-700/70 max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', sub }) {
  const tones = {
    brand: {
      icon: 'bg-brand-50 text-brand-700 dark:text-brand-300',
      bar: 'bg-brand-700',
      wash: 'from-brand-50/80 to-transparent dark:from-brand-50/30',
    },
    green: {
      icon: 'bg-accent-greenLight text-accent-green',
      bar: 'bg-accent-green',
      wash: 'from-accent-greenLight/80 to-transparent',
    },
    red: {
      icon: 'bg-accent-redLight text-accent-red',
      bar: 'bg-accent-red',
      wash: 'from-accent-redLight/80 to-transparent',
    },
    amber: {
      icon: 'bg-accent-amberLight text-accent-amber',
      bar: 'bg-accent-amber',
      wash: 'from-accent-amberLight/80 to-transparent',
    },
    ink: {
      icon: 'bg-surface-muted text-ink-700',
      bar: 'bg-ink-700/40',
      wash: 'from-surface-muted/80 to-transparent',
    },
  };
  const t = tones[tone] || tones.brand;
  return (
    <Card className="relative overflow-hidden p-5 group hover:shadow-cardHover hover:-translate-y-0.5 transition-all duration-300 border-surface-border/80">
      <div className={`absolute inset-y-0 left-0 w-[3px] ${t.bar}`} />
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.wash} opacity-70`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-700/60 mb-1">{label}</p>
          <p className="font-mono-num text-2xl font-bold text-ink-900 truncate">{value}</p>
          {sub && <p className="text-xs text-ink-700/55 mt-2">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${t.icon}`}>
            <Icon size={20} strokeWidth={2.1} />
          </div>
        )}
      </div>
    </Card>
  );
}
