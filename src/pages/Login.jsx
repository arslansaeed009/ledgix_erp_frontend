import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useCompany } from '../lib/CompanyContext';
import { CompanyBrand } from '../components/CompanyBrand';
import { Button, Input } from '../components/ui';
import api, { apiErrorMessage } from '../lib/api';

export default function Login() {
  const { login, signup, user, loading: authLoading } = useAuth();
  const { hasBranding } = useCompany();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    rememberMe: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // login | signup | pending | forgot | reset
  const [resetInfo, setResetInfo] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-700/60">
        Checking your session…
      </div>
    );
  }
  if (user?.status === 'Approved' && user.role !== 'Super Admin') {
    return <Navigate to="/dashboard" replace />;
  }

  function switchMode(next) {
    setMode(next);
    setError('');
    setResetInfo(null);
    setAccountStatus(null);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setAccountStatus(null);
    setLoading(true);
    try {
      await login(form.email, form.password, form.rememberMe);
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.data?.status;
      if (['Pending', 'Declined', 'Blocked'].includes(status)) {
        setAccountStatus(status);
      } else {
        setError(apiErrorMessage(err, 'Login failed.'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
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
      await signup(form.name, form.email, form.password, form.phone);
      setPendingEmail(form.email.trim());
      setMode('pending');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create account.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: form.email });
      setResetInfo(data);
      setMode('reset');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not process request.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.target);
    try {
      await api.post('/auth/reset-password', {
        token: resetInfo.resetToken,
        newPassword: fd.get('newPassword')
      });
      setMode('login');
      setResetInfo(null);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reset password.'));
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
            <h1 className="font-display font-bold text-2xl text-white">
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </h1>
            <p className="text-white/50 text-sm mt-1">ERP &amp; Ledger Management</p>
          </div>
        )}
        <div className="bg-surface rounded-2xl shadow-cardHover p-7 border border-surface-border">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">Sign in</h2>
              <Input label="Email" type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <Input label="Password" type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-ink-700/70">
                  <input type="checkbox" checked={form.rememberMe}
                    onChange={e => setForm(f => ({ ...f, rememberMe: e.target.checked }))}
                    className="rounded border-surface-border text-brand-700" />
                  Remember me
                </label>
                <button type="button" onClick={() => switchMode('forgot')} className="text-sm text-brand-700 font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
              {accountStatus && (
                <div
                  className={`rounded-lg px-3 py-3 text-sm ${
                    accountStatus === 'Pending'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-accent-redLight text-accent-red'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <strong className="block mb-1">
                    {accountStatus === 'Pending'
                      ? 'Approval pending'
                      : accountStatus === 'Declined'
                        ? 'Account request declined'
                        : 'Account blocked'}
                  </strong>
                  {accountStatus === 'Pending'
                    ? 'Your request is waiting for administrator approval. Please wait; you can sign in once your account is approved.'
                    : accountStatus === 'Declined'
                      ? 'Your account request was declined. Please contact the administrator for assistance.'
                      : 'Your account is blocked and cannot access the dashboard. Please contact the administrator for assistance.'}
                </div>
              )}
              {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'} <ArrowRight size={18} />
              </Button>
              <p className="text-sm text-ink-700/60 text-center pt-1">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="text-brand-700 font-semibold hover:underline">
                  Sign up
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">Create your account</h2>
              <p className="text-sm text-ink-700/60 -mt-2 mb-1">Create your own company workspace with a private dashboard and branding.</p>
              <Input label="Full name" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
              <Input label="Role" value="User" readOnly aria-readonly="true" />
              <Input label="Email" type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
              <Input label="Phone (optional)" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input label="Password" type="password" required minLength={6} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" />
              <Input label="Confirm password" type="password" required minLength={6} value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
              {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating account…' : 'Sign Up'} <ArrowRight size={18} />
              </Button>
              <p className="text-sm text-ink-700/60 text-center pt-1">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-brand-700 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">Reset your password</h2>
              <p className="text-sm text-ink-700/60">Enter your account email to generate a reset token.</p>
              <Input label="Email" type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait…' : 'Generate Reset Token'} <KeyRound size={16} />
              </Button>
              <button type="button" onClick={() => switchMode('login')} className="text-sm text-ink-700/60 hover:underline w-full text-center">
                Back to sign in
              </button>
            </form>
          )}

          {mode === 'reset' && resetInfo && (
            <form onSubmit={handleReset} className="space-y-4">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-1">Set a new password</h2>
              <p className="text-xs text-ink-700/50 bg-surface-soft rounded-lg px-3 py-2">
                No email server is configured yet, so here is your one-time reset token directly. It expires in 1 hour.
                <span className="block font-mono-num text-ink-800 mt-1 break-all">{resetInfo.resetToken}</span>
              </p>
              <Input name="newPassword" label="New password" type="password" required minLength={6} />
              {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          )}

          {mode === 'pending' && (
            <section className="space-y-4 text-center" aria-live="polite">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <KeyRound size={22} />
              </div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Approval pending
              </h2>
              <p className="text-sm leading-6 text-ink-700/70">
                Your account request for <strong>{pendingEmail}</strong> was
                submitted. You can sign in after a platform administrator
                approves it.
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => switchMode('login')}
              >
                Back to sign in
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
