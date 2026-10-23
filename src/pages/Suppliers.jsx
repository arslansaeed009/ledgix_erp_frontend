import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Truck } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney } from '../lib/format';
import { Card, Button, Input, Modal, EmptyState, Spinner } from '../components/ui';

const emptyForm = { name: '', company: '', phone: '', email: '', address: '', city: '', opening_balance: 0, notes: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [saving, setSaving] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const navigate = useNavigate();
  const requestIdRef = useRef(0);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (overrides = {}) => {
    const requestId = ++requestIdRef.current;
    const searchTerm = overrides.search !== undefined ? overrides.search : debouncedSearch;
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const { data } = await api.get('/suppliers', {
        params: { search: searchTerm || undefined },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (requestId !== requestIdRef.current) return;
      if (!Array.isArray(data?.suppliers)) {
        setListError('');
        hasLoadedOnce.current = true;
        return;
      }
      setSuppliers(data.suppliers.filter(s => s?.id));
      setListError('');
      hasLoadedOnce.current = true;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setListError(apiErrorMessage(err, 'Could not load suppliers.'));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setError(''); setModalOpen(true); }
  function openEdit(s) { setEditing(s); setForm({ ...emptyForm, ...s }); setError(''); setModalOpen(true); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const { data } = await api.put(`/suppliers/${editing.id}`, form);
        const updated = data.supplier;
        if (updated?.id) {
          setSuppliers(current => current.map(s => (
            s.id === updated.id ? { ...s, ...updated, current_balance: updated.current_balance ?? s.current_balance } : s
          )));
        }
        setModalOpen(false);
        await load();
      } else {
        const { data } = await api.post('/suppliers', form);
        const created = data.supplier;
        if (!created?.id) {
          setError('Supplier was saved but the server did not return it.');
          return;
        }
        setSearch('');
        setDebouncedSearch('');
        setSuppliers(current => (
          [...current.filter(s => s.id !== created.id), { ...created, current_balance: created.current_balance ?? 0 }]
            .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
        ));
        setModalOpen(false);
        await load({ search: '' });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save supplier.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s) {
    if (!confirm(`Permanently delete "${s.name}"?\n\nThis will also remove their purchase orders, invoices, payments, and ledger.\n\nThis cannot be undone.`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete supplier.'));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Suppliers</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add Supplier</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {listError ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-accent-red">{listError}</p>
            <Button variant="outline" onClick={load}>Retry</Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : suppliers.length === 0 ? (
          <EmptyState icon={Truck} title="No suppliers yet" description="Add your equipment and parts suppliers to track purchases and payments."
            action={<Button onClick={openCreate}><Plus size={16} /> Add Supplier</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium text-right">Balance</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-3">
                      <button onClick={() => navigate(`/suppliers/${s.id}`)} className="text-left">
                        <p className="font-medium text-ink-900 hover:text-brand-700">{s.name}</p>
                        {s.company && <p className="text-xs text-ink-700/50">{s.company}</p>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-ink-700/70">{s.city || '—'}</td>
                    <td className="px-5 py-3 text-ink-700/70">{s.phone || '—'}</td>
                    <td className={`px-5 py-3 text-right font-mono-num font-semibold ${s.current_balance > 0 ? 'text-accent-red' : 'text-ink-700/50'}`}>{formatMoney(s.current_balance)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-700/60"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(s)} className="w-8 h-8 rounded-lg hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/60"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Supplier name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Company" value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            <Input label="Phone" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="City" value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Opening balance" type="number" disabled={!!editing} value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} />
          </div>
          <Input label="Address" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Supplier'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
