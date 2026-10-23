import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, todayISO } from '../lib/format';
import { Card, Button, Input, Select, Textarea, Spinner } from '../components/ui';
import LineItemsEditor from '../components/LineItemsEditor';

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    doc_type: 'invoice', customer_id: '', date: todayISO(), due_date: '', discount_type: 'fixed', discount_value: 0,
    shipping_amount: 0, terms: 'Payment due within the stated terms. Late payments may incur additional charges.', notes: ''
  });
  const [items, setItems] = useState([{ product_id: '', description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }]);
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInCustomer, setWalkInCustomer] = useState({ name: '', city: '', phone: '' });
  const [walkInError, setWalkInError] = useState('');
  const [walkInSaving, setWalkInSaving] = useState(false);
  const walkInSubmission = useRef(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data.customers));
    api.get('/products').then(res => setProducts(res.data.products));
    api.get('/settings').then(res => setSettings(res.data.settings));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/invoices/${id}`).then(res => {
      const inv = res.data.invoice;
      setForm({
        doc_type: inv.doc_type, customer_id: inv.customer_id, date: inv.date, due_date: inv.due_date || '',
        discount_type: inv.discount_type, discount_value: inv.discount_value, shipping_amount: inv.shipping_amount,
        terms: inv.terms || '', notes: inv.notes || ''
      });
      setItems(res.data.items.map(it => ({ ...it })));
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(key, value) { setForm(f => ({ ...f, [key]: value })); }
  const totals = calcPreview(items, form);

  async function handleWalkInCustomerCreate() {
    if (walkInSubmission.current) return;
    setWalkInError('');
    if (!walkInCustomer.name.trim() || !walkInCustomer.city.trim() || !walkInCustomer.phone.trim()) {
      setWalkInError('Enter the customer name, city, and phone number.');
      return;
    }
    walkInSubmission.current = true;
    setWalkInSaving(true);
    try {
      const { data } = await api.post('/customers', { ...walkInCustomer, customer_type: 'Retail', walk_in: true });
      const customer = data.customer;
      setCustomers(current => [...current, customer].sort((a, b) => a.name.localeCompare(b.name)));
      set('customer_id', String(customer.id));
      setWalkInCustomer({ name: '', city: '', phone: '' });
      setShowWalkInForm(false);
    } catch (err) {
      setWalkInError(apiErrorMessage(err, 'Could not save walk-in customer.'));
    } finally {
      walkInSubmission.current = false;
      setWalkInSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (walkInSaving) { setError('Please wait for the walk-in customer to finish saving.'); return; }
    if (!customers.some(customer => String(customer.id) === String(form.customer_id))) {
      setError('Please select a valid customer.');
      return;
    }
    if (items.length === 0 || items.every(it => !it.description)) { setError('Add at least one item.'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/invoices/${id}`, { ...form, items });
        navigate(`/invoices/${id}`);
      } else {
        const { data } = await api.post('/invoices', { ...form, items });
        navigate(`/invoices/${data.invoice.id}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err, `Could not ${isEdit ? 'update' : 'create'} invoice.`));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => navigate(isEdit ? `/invoices/${id}` : '/invoices')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="font-display font-bold text-2xl text-ink-900">{isEdit ? 'Edit' : 'New'} {form.doc_type === 'bill' ? 'Bill' : 'Invoice'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-4">
          <div className="flex gap-2">
            <button type="button" disabled={isEdit} onClick={() => set('doc_type', 'bill')}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${form.doc_type === 'bill' ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-surface-border text-ink-700/60 hover:bg-surface-soft'}`}>
              Bill — for Retail / Wholesale customers
            </button>
            <button type="button" disabled={isEdit} onClick={() => set('doc_type', 'invoice')}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${form.doc_type === 'invoice' ? 'border-brand-700 bg-brand-50 text-brand-700' : 'border-surface-border text-ink-700/60 hover:bg-surface-soft'}`}>
              Invoice — for Companies (with NTN / STRN)
            </button>
          </div>
          {isEdit && <p className="text-xs text-ink-700/50 mt-2">Document type can't be changed after creation since its number has already been assigned.</p>}
        </Card>

        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Select label="Customer" required value={form.customer_id} onChange={e => set('customer_id', e.target.value)}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              {!isEdit && (
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowWalkInForm(open => !open); setWalkInError(''); }}>
                  Add Walk-In Customer
                </Button>
              )}
            </div>
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <Input label="Due Date" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            {showWalkInForm && !isEdit && (
              <div className="col-span-3 rounded-xl border border-surface-border bg-surface-soft/50 p-4">
                <h3 className="font-semibold text-sm text-ink-900 mb-3">Walk-In Customer Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Customer Name" value={walkInCustomer.name}
                    onChange={e => setWalkInCustomer(customer => ({ ...customer, name: e.target.value }))} />
                  <Input label="City" value={walkInCustomer.city}
                    onChange={e => setWalkInCustomer(customer => ({ ...customer, city: e.target.value }))} />
                  <Input label="Phone Number" type="tel" value={walkInCustomer.phone}
                    onChange={e => setWalkInCustomer(customer => ({ ...customer, phone: e.target.value }))} />
                </div>
                {walkInError && <p className="text-sm text-accent-red mt-3">{walkInError}</p>}
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" disabled={walkInSaving} onClick={() => setShowWalkInForm(false)}>Cancel</Button>
                  <Button type="button" disabled={walkInSaving} onClick={handleWalkInCustomerCreate}>
                    {walkInSaving ? 'Saving Customer…' : 'Save & Select Customer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-ink-900 mb-4">Items</h3>
          <LineItemsEditor items={items} onChange={setItems} products={products} currencySymbol={settings.currency_symbol} />
        </Card>

        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Select label="Discount type" value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
              <option value="fixed">Fixed amount</option>
              <option value="percent">Percentage</option>
            </Select>
            <Input label="Discount value" type="number" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} />
            <Input label="Shipping amount" type="number" value={form.shipping_amount} onChange={e => set('shipping_amount', e.target.value)} />
          </div>
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatMoney(totals.subtotal, settings.currency_symbol)} />
              <Row label="Discount" value={`- ${formatMoney(totals.discountAmount, settings.currency_symbol)}`} />
              <Row label="Tax" value={formatMoney(totals.tax, settings.currency_symbol)} />
              <Row label="Shipping" value={formatMoney(Number(form.shipping_amount) || 0, settings.currency_symbol)} />
              <div className="border-t border-surface-border pt-1.5">
                <Row label="Total" value={formatMoney(totals.total, settings.currency_symbol)} bold />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <Textarea label="Terms & Conditions" rows={3} value={form.terms} onChange={e => set('terms', e.target.value)} />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </Card>

        {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/invoices/${id}` : '/invoices')}>Cancel</Button>
          <Button type="submit" disabled={saving || walkInSaving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}

function calcPreview(items, form) {
  let subtotal = 0, tax = 0;
  for (const it of items) {
    const gross = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const afterDisc = gross - (gross * (Number(it.discount_percent) || 0) / 100);
    subtotal += afterDisc;
    tax += afterDisc * (Number(it.tax_percent) || 0) / 100;
  }
  const discountAmount = form.discount_type === 'percent' ? subtotal * (Number(form.discount_value) || 0) / 100 : (Number(form.discount_value) || 0);
  const shipping = Number(form.shipping_amount) || 0;
  const total = subtotal - discountAmount + tax + shipping;
  return { subtotal, tax, discountAmount, total };
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-ink-700/70 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`font-mono-num ${bold ? 'font-bold text-base text-brand-700' : 'font-medium text-ink-900'}`}>{value}</span>
    </div>
  );
}
