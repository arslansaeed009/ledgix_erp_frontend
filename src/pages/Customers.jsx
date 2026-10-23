import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Phone, MessageCircle, Pencil, Trash2, Users } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney } from '../lib/format';
import { Card, Button, Input, Select, Badge, Modal, EmptyState, Spinner } from '../components/ui';

const CUSTOMER_TYPES = ['Dealer', 'Retail', 'Corporate', 'Government', 'Contractor'];
const SEARCH_DEBOUNCE_MS = 300;

const emptyForm = {
  name: '', company: '', phone: '', whatsapp: '', email: '', ntn: '', strn: '',
  address: '', city: '', country: 'Pakistan', opening_balance: 0, credit_limit: 0,
  customer_type: 'Retail', notes: ''
};

export default function Customers() {
  const [params] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const requestIdRef = useRef(0);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (overrides = {}) => {
    const requestId = ++requestIdRef.current;
    const searchTerm = overrides.search !== undefined ? overrides.search : debouncedSearch;
    const customerType = overrides.customer_type !== undefined ? overrides.customer_type : typeFilter;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const { data } = await api.get('/customers', {
        params: {
          search: searchTerm || undefined,
          customer_type: customerType || undefined
        }
      });
      if (requestId !== requestIdRef.current) return;
      setCustomers(data.customers);
      setListError('');
      hasLoadedOnce.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setListError(apiErrorMessage(err, 'Could not load customers.'));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedSearch, typeFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ ...emptyForm, ...c, opening_balance: c.opening_balance });
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, form);
        setModalOpen(false);
        await load();
      } else {
        await api.post('/customers', form);
        setSearch('');
        setDebouncedSearch('');
        setTypeFilter('');
        setModalOpen(false);
        await load({ search: '', customer_type: '' });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save customer.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c, e) {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    const ok = confirm(
      `Permanently delete "${c.name}"?\n\nThis will also remove their invoices, quotations, payments, ledger entries, and documents. Stock from active invoices will be restored.\n\nThis cannot be undone.`
    );
    if (!ok) return;
    try {
      await api.delete(`/customers/${c.id}`);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete customer.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Customers</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add Customer</Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, phone, email…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40"
          />
        </div>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="sm:w-48">
          <option value="">All Types</option>
          {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {listError ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-accent-red">{listError}</p>
            <Button variant="outline" onClick={load}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add your first customer to start creating quotations, invoices and tracking their ledger."
            action={<Button onClick={openCreate}><Plus size={16} /> Add Customer</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/customers/${c.id}`)} className="text-left">
                        <p className="font-medium text-ink-900 hover:text-brand-700">{c.name}</p>
                        {c.company && <p className="text-xs text-ink-700/50">{c.company}</p>}
                      </button>
                    </td>
                    <td className="px-5 py-3"><Badge tone="brand">{c.customer_type}</Badge></td>
                    <td className="px-5 py-3 text-ink-700/80">
                      <div className="flex items-center gap-3">
                        {c.phone && <span className="flex items-center gap-1 text-xs"><Phone size={12} /> {c.phone}</span>}
                        {c.whatsapp && (
                          <a href={`https://wa.me/${c.whatsapp.replace(/^0/, '92').replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                            className="text-accent-green hover:opacity-70" title="Open WhatsApp">
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-700/70">{c.city || '—'}</td>
                    <td className={`px-5 py-3 text-right font-mono-num font-semibold ${c.current_balance > 0 ? 'text-accent-red' : c.current_balance < 0 ? 'text-accent-green' : 'text-ink-700/50'}`}>
                      {formatMoney(c.current_balance)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                          className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-700/60"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(c, e)}
                          className="w-8 h-8 rounded-lg hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/60"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'} width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Select label="Customer type" value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))}>
              {CUSTOMER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="NTN" value={form.ntn} onChange={e => setForm(f => ({ ...f, ntn: e.target.value }))} />
            <Input label="STRN" value={form.strn} onChange={e => setForm(f => ({ ...f, strn: e.target.value }))} />
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            <Input label="Opening balance" type="number" step="0.01" disabled={!!editing}
              value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} />
            <Input label="Credit limit" type="number" step="0.01"
              value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Customer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
