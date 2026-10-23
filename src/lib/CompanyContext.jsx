import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';
import { useAuth } from './AuthContext';
import { API_ORIGIN } from './config';
import faviconUrl from '../assets/favi.png';

const CompanyContext = createContext(null);

/** Resolve an uploaded asset path (e.g. /uploads/branding/logo-….png) to a full URL. */
export function assetUrl(relPath) {
  if (!relPath) return '';
  if (/^https?:\/\//i.test(relPath) || relPath.startsWith('data:')) return relPath;
  return `${API_ORIGIN}${relPath.startsWith('/') ? relPath : `/${relPath}`}`;
}

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      if (user) {
        const { data } = await api.get('/settings');
        setSettings(data.settings || {});
      } else {
        // Logged-out: generic empty branding (each company has its own after login).
        const brandRes = await api.get('/settings/branding');
        setSettings(brandRes.data.branding || {});
      }
      setLoaded(true);
      return null;
    } catch {
      setLoaded(true);
      return null;
    }
  }, [user]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Keep the browser tab title + favicon in sync with configured company branding.
  useEffect(() => {
    const name = (settings.company_name || '').trim();
    document.title = name ? `${name} | ERP` : 'ERP & Ledger Management';

    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = faviconUrl;
  }, [settings.company_name, settings.logo_path]);

  const value = useMemo(() => {
    const companyName = (settings.company_name || '').trim();
    const tagline = (settings.company_tagline || '').trim();
    const logoPath = settings.logo_path || '';
    return {
      settings,
      setSettings,
      loaded,
      refreshSettings,
      companyName,
      tagline,
      logoUrl: assetUrl(logoPath),
      hasBranding: Boolean(companyName || logoPath),
      // Empty when unset — callers should omit company phrasing if blank.
      brandLabel: companyName,
    };
  }, [settings, loaded, refreshSettings]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
