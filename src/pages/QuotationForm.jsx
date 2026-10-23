import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { formatMoney, todayISO } from '../lib/format';
import { Card, Button, Input, Select, Textarea } from '../components/ui';
import LineItemsEditor from '../components/LineItemsEditor';

export default function QuotationForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [form, setForm] = useState({
    customer_id: '', date: todayISO(), validity_date: '', discount_type: 'fixed', discount_value: 0,
    shipping_amount: 0, terms: 'Prices valid for the period stated above. 50% advance required to confirm order.', notes: ''
  });
  const [items, setItems] = useState([{ product_id: '', description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data.customers));
    api.get('/products').then(res => setProducts(res.data.products));
    api.get('/settings').then(res => setSettings(res.data.settings));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/quotations/${id}`).then(res => {
      const q = res.data.quotation;
      setForm({
        customer_id: q.customer_id, date: q.date, validity_date: q.validity_date || '',
        discount_type: q.discount_type, discount_value: q.discount_value, shipping_amount: q.shipping_amount,
        terms: q.terms || '', notes: q.notes || ''
      });
      setItems(res.data.items.map(it => ({ ...it })));
    });
  }, [id, isEdit]);

  function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

  const totals = calcPreview(items, form);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.customer_id) { setError('Please select a customer.'); return; }
    if (items.length === 0 || items.every(it => !it.description)) { setError('Add at least one item.'); return; }

    setSaving(true);
    const payload = { ...form, items };
    try {
      if (isEdit) {
        await api.put(`/quotations/${id}`, payload);
        navigate(`/quotations/${id}`);
      } else {
        const { data } = await api.post('/quotations', payload);
        navigate(`/quotations/${data.quotation.id}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save quotation.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={() => navigate('/quotations')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Quotations
      </button>
      <h1 className="font-display font-bold text-2xl text-ink-900">{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <Select label="Customer" required value={form.customer_id} onChange={e => set('customer_id', e.target.value)} className="col-span-1">
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            <Input label="Valid Until" type="date" value={form.validity_date} onChange={e => set('validity_date', e.target.value)} />
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
          <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Quotation'}</Button>
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
