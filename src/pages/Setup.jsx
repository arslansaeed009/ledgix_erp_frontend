import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useCompany } from '../lib/CompanyContext';
import { CompanyBrand } from '../components/CompanyBrand';
import { Button, Input } from '../components/ui';
import { apiErrorMessage } from '../lib/api';

export default function Setup() {
  const { setupAdmin } = useAuth();
  const { hasBranding } = useCompany();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await setupAdmin(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not complete setup.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />
      <div className="relative w-full max-w-md">
        {hasBranding ? (
          <CompanyBrand variant="dark" size="md" />
        ) : (
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-white">Welcome</h1>
            <p className="text-white/50 text-sm mt-1">Set up your ERP &amp; Ledger system</p>
          </div>
        )}

        <div className="bg-surface rounded-2xl shadow-cardHover p-7 border border-surface-border">
          <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">Welcome — let's get you set up</h2>
          <p className="text-sm text-ink-700/60 mb-6">Create the Admin account. This runs once; after this, you'll log in normally.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" placeholder="e.g. Arslan Asif" required
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email" type="email" placeholder="admin@company.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Password" type="password" placeholder="At least 6 characters" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <Input label="Confirm password" type="password" required
              value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />

            {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Setting up…' : 'Create Admin Account'} <ArrowRight size={18} />
            </Button>
          </form>
        </div>
        <p className="text-center text-white/30 text-xs mt-6">This device will be your primary business admin panel.</p>
      </div>
    </div>
  );
}
