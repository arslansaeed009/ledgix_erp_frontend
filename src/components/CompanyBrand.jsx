import { useCompany } from '../lib/CompanyContext';
import defaultLogo from '../assets/logo.png';

/**
 * Shared company brand mark for login, dashboard, reports, etc.
 * Renders nothing until branding is configured (generic ERP mode).
 */
export function CompanyBrand({
  variant = 'dark', // dark = on dark backgrounds (login); light = on app surfaces
  size = 'md',
  className = '',
  showTagline = true,
}) {
  const { companyName, tagline, logoUrl, hasBranding } = useCompany();
  if (!hasBranding) {
    return (
      <div className={`text-center ${className}`}>
        <img src={defaultLogo} alt="Ledgix" className="w-16 h-16 object-contain mx-auto mb-3" />
      </div>
    );
  }

  const sizes = {
    sm: { logo: 'w-8 h-8', title: 'text-base', gap: 'gap-2', wrap: 'mb-0' },
    md: { logo: 'w-14 h-14', title: 'text-2xl', gap: 'gap-3', wrap: 'mb-8' },
    lg: { logo: 'w-16 h-16', title: 'text-3xl', gap: 'gap-3', wrap: 'mb-8' },
  };
  const s = sizes[size] || sizes.md;
  const titleColor = variant === 'dark' ? 'text-white' : 'text-ink-900';
  const tagColor = variant === 'dark' ? 'text-white/50' : 'text-ink-700/60';

  return (
    <div className={`text-center ${s.wrap} ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName || 'Company logo'}
          className={`${s.logo} rounded-2xl object-contain mx-auto mb-3 bg-white/10 p-1`}
        />
      ) : (
        <img src={defaultLogo} alt="Ledgix" className={`${s.logo} object-contain mx-auto mb-3`} />
      )}
      {companyName ? (
        <h1 className={`font-display font-bold ${s.title} ${titleColor}`}>{companyName}</h1>
      ) : null}
      {showTagline && tagline ? (
        <p className={`${tagColor} text-sm mt-1`}>{tagline}</p>
      ) : null}
    </div>
  );
}

/** Compact inline brand for page headers (dashboard, reports). */
export function CompanyPageHeading({ title, subtitle }) {
  const { companyName, tagline, logoUrl } = useCompany();
  return (
    <div className="flex items-start gap-3 min-w-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName || 'Logo'}
          className="w-11 h-11 rounded-xl object-contain border border-surface-border bg-surface-soft p-1 shrink-0"
        />
      ) : null}
      <div className="min-w-0">
        {companyName ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300 truncate">
            {companyName}{tagline ? ` · ${tagline}` : ''}
          </p>
        ) : null}
        <h1 className="font-display font-bold text-2xl text-ink-900">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-700/60 mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
  );
}
