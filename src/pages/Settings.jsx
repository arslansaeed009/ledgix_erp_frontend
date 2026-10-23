import { useEffect, useState, useRef } from 'react';
import { Building2, Upload, Check, Moon, Sun } from 'lucide-react';
import api from '../lib/api';
import { useCompany, assetUrl } from '../lib/CompanyContext';
import { applyTheme, getStoredTheme, subscribeTheme } from '../lib/theme';
import { Card, Button, Input, Select, Textarea } from '../components/ui';

const FIELDS = [
  ['company_name', 'Company Name'],
  ['company_tagline', 'Company Tagline'],
  ['company_phone', 'Phone Number'],
  ['company_email', 'Email'],
  ['company_website', 'Website'],
  ['company_ntn', 'NTN / Tax ID'],
  ['company_strn', 'STRN'],
];

export default function Settings() {
  const { settings: savedSettings, refreshSettings, setSettings: setCompanySettings } = useCompany();
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme());
  const [themeSaved, setThemeSaved] = useState(false);
  const logoRef = useRef(null), stampRef = useRef(null), signRef = useRef(null);

  useEffect(() => {
    if (savedSettings && Object.keys(savedSettings).length) {
      setSettings({ ...savedSettings });
    }
  }, [savedSettings]);

  useEffect(() => subscribeTheme(setTheme), []);

  if (!settings) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Settings</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">Loading company information…</p>
        </div>
      </div>
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', { ...settings, theme });
      setSettings(data.settings);
      setCompanySettings(data.settings);
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
    try {
      const { data } = await api.put('/settings', { theme: next });
      setSettings(s => ({ ...s, ...data.settings }));
      setCompanySettings(data.settings);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    } catch {
      // Theme still applied locally even if server save fails.
    }
  }

  async function handleFileUpload(type, file) {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post(`/settings/upload/${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    const next = { ...settings, [`${type}_path`]: data.path };
    setSettings(next);
    setCompanySettings(next);
    await refreshSettings();
  }

  const darkOn = theme === 'dark';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-700/60 mt-0.5">Company information, appearance, and document branding</p>
      </div>

      <Card className="p-6">
        <h3 className="font-display font-semibold text-ink-900 mb-1 flex items-center gap-2">
          {darkOn ? <Moon size={17} /> : <Sun size={17} />}
          Appearance
        </h3>
        <p className="text-xs text-ink-700/50 mb-4">Choose light or dark mode. Your preference is saved for this account.</p>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface-soft px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">Dark Mode</p>
            <p className="text-xs text-ink-700/50 mt-0.5">{darkOn ? 'On — easier on the eyes at night' : 'Off — light theme'}</p>
          </div>
          <div className="flex items-center gap-3">
            {themeSaved && <span className="text-xs text-accent-green flex items-center gap-1"><Check size={14} /> Saved</span>}
            <button
              type="button"
              role="switch"
              aria-checked={darkOn}
              aria-label="Toggle dark mode"
              onClick={handleThemeToggle}
              className={`relative h-8 w-14 rounded-full transition-colors ${darkOn ? 'bg-brand-700' : 'bg-surface-border'}`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform flex items-center justify-center text-ink-700 ${darkOn ? 'translate-x-6' : 'translate-x-0'}`}
              >
                {darkOn ? <Moon size={13} /> : <Sun size={13} />}
              </span>
            </button>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4 flex items-center gap-2"><Building2 size={17} /> Company Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.map(([key, label]) => (
              <Input
                key={key}
                label={label}
                value={settings[key] || ''}
                onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                placeholder={key === 'company_tagline' ? 'e.g. Quality industrial solutions' : undefined}
              />
            ))}
            <Select label="Currency" value={settings.currency || 'PKR'} onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}>
              <option value="PKR">PKR — Pakistani Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="AED">AED — UAE Dirham</option>
            </Select>
            <Input label="Currency symbol" value={settings.currency_symbol || ''} onChange={e => setSettings(s => ({ ...s, currency_symbol: e.target.value }))} />
          </div>
          <div className="mt-4">
            <Textarea
              label="Company Address"
              rows={3}
              value={settings.company_address || ''}
              onChange={e => setSettings(s => ({ ...s, company_address: e.target.value }))}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Document Numbering</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Invoice prefix" value={settings.invoice_prefix || ''} onChange={e => setSettings(s => ({ ...s, invoice_prefix: e.target.value }))} />
            <Input label="Quotation prefix" value={settings.quotation_prefix || ''} onChange={e => setSettings(s => ({ ...s, quotation_prefix: e.target.value }))} />
            <Input label="Receipt prefix" value={settings.receipt_prefix || ''} onChange={e => setSettings(s => ({ ...s, receipt_prefix: e.target.value }))} />
            <Input label="Purchase order prefix" value={settings.purchase_order_prefix || ''} onChange={e => setSettings(s => ({ ...s, purchase_order_prefix: e.target.value }))} />
            <Input label="Default tax %" type="number" value={settings.default_tax_percent || ''} onChange={e => setSettings(s => ({ ...s, default_tax_percent: e.target.value }))} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-1">Branding</h3>
          <p className="text-xs text-ink-700/50 mb-4">Logo appears in the sidebar and on PDFs. Stamp and signature appear on invoices and quotations.</p>
          <div className="grid grid-cols-3 gap-4">
            <BrandUpload label="Company Logo" path={settings.logo_path} inputRef={logoRef} onUpload={f => handleFileUpload('logo', f)} />
            <BrandUpload label="Company Stamp" path={settings.stamp_path} inputRef={stampRef} onUpload={f => handleFileUpload('stamp', f)} />
            <BrandUpload label="Company Signature" path={settings.signature_path} inputRef={signRef} onUpload={f => handleFileUpload('signature', f)} />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Button>
          {saved && <span className="text-sm text-accent-green flex items-center gap-1"><Check size={15} /> Saved — branding updated</span>}
        </div>
      </form>
    </div>
  );
}

function BrandUpload({ label, path, inputRef, onUpload }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-700/70 mb-1.5">{label}</p>
      <div className="aspect-square rounded-xl bg-surface-soft border border-dashed border-surface-border flex items-center justify-center overflow-hidden mb-2">
        {path ? <img src={assetUrl(path)} alt={label} className="w-full h-full object-contain p-2" /> : <Upload size={20} className="text-ink-700/30" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => e.target.files[0] && onUpload(e.target.files[0])} />
      <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => inputRef.current?.click()}>Upload</Button>
    </div>
  );
}
