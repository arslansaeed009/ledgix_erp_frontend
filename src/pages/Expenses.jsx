import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, formatDate, todayISO } from '../lib/format';
import { Card, Button, Select, Input, Modal, EmptyState, Spinner } from '../components/ui';
import { useCategories } from '../hooks/useCategories';

function categoryName(category) {
  return typeof category === 'string' ? category : category?.name || '';
}

function expenseDateValue(value) {
  if (!value) return todayISO();
  return String(value).slice(0, 10);
}

export default function Expenses() {
  const {
    categories,
    canAdd: canAddCategory,
    error: categoriesError,
    addCategory,
    refreshCategories,
  } = useCategories({ endpoint: '/expenses/categories' });
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: '', description: '', amount: '', date: todayISO(), payment_method: '', notes: '' });
  const [newCategory, setNewCategory] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/expenses', { params: { category: categoryFilter || undefined } }).then(res => {
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
    }).finally(() => setLoading(false));
  }, [categoryFilter]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ category: '', description: '', amount: '', date: todayISO(), payment_method: '', notes: '' });
    setNewCategory('');
    setError('');
    setModalOpen(true);
  }

  function openEdit(e) {
    setEditing(e);
    setForm({
      category: e.category || '',
      description: e.description || '',
      amount: e.amount ?? '',
      date: expenseDateValue(e.date),
      payment_method: e.payment_method || '',
      notes: e.notes || '',
    });
    setNewCategory('');
    setError('');
    setModalOpen(true);
  }

  async function handleAddCategory() {
    if (!newCategory.trim() || categorySaving || !canAddCategory) return;
    setError('');
    setCategorySaving(true);
    try {
      const category = await addCategory(newCategory);
      setForm(f => ({ ...f, category: category.name }));
      setNewCategory('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add expense category.'));
    } finally {
      setCategorySaving(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form);
      else await api.post('/expenses', form);
      setModalOpen(false);
      load();
      refreshCategories();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save expense.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e) {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${e.id}`);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Expenses</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">Total: <span className="font-mono-num font-semibold text-ink-900">{formatMoney(total)}</span></p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add Expense</Button>
      </div>

      <Card className="p-4">
        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">All Categories</option>
          {categories.map(c => {
            const name = categoryName(c);
            return <option key={c.id ?? name} value={name}>{name}</option>;
          })}
        </Select>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : expenses.length === 0 ? (
          <EmptyState icon={Wrench} title="No expenses recorded yet" description="Track fuel, salaries, rent and other business costs here."
            action={<Button onClick={openCreate}><Plus size={16} /> Add Expense</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="px-5 py-3 text-ink-700/70">{formatDate(e.date)}</td>
                    <td className="px-5 py-3 font-medium text-ink-900">{e.category}</td>
                    <td className="px-5 py-3 text-ink-700/70">{e.description || '—'}</td>
                    <td className="px-5 py-3 text-ink-700/70 capitalize">{e.payment_method || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono-num font-semibold">{formatMoney(e.amount)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center text-ink-700/60"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(e)} className="w-8 h-8 rounded-lg hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/60"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Select label="Category" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map(c => {
                const name = categoryName(c);
                return <option key={c.id ?? name} value={name}>{name}</option>;
              })}
            </Select>
            {canAddCategory && (
              <div className="flex gap-2 mt-2">
                <input
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  placeholder="New category name"
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-soft border border-surface-border text-xs outline-none focus:border-brand-500"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddCategory} disabled={!newCategory.trim() || categorySaving}>
                  <Plus size={13} /> {categorySaving ? 'Adding…' : 'Add Category'}
                </Button>
              </div>
            )}
            {categoriesError && !error && (
              <p className="text-xs text-accent-red mt-1">{categoriesError}</p>
            )}
          </div>
          <Input label="Description" value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="Amount" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Date" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Select label="Payment method" value={form.payment_method || ''} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
            <option value="">Select</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="online">Online</option>
          </Select>
          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
