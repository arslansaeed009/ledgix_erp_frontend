import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Barcode, Check, ChevronDown, CircleUserRound, Clock3, Minus, Package,
  Plus, Search, ShoppingCart, Trash2, UserRound, X
} from 'lucide-react';
import api, { apiErrorMessage } from '../lib/api';
import { API_ORIGIN } from '../lib/config';
import { formatMoney, todayISO } from '../lib/format';
import { useCompany } from '../lib/CompanyContext';
import { useCategories } from '../hooks/useCategories';
import { Button, Card, Modal, Spinner } from '../components/ui';

const METHODS = ['cash', 'bank', 'cheque', 'jazzcash', 'easypaisa', 'card', 'online'];

export default function Pos() {
  const navigate = useNavigate();
  const { companyName, tagline } = useCompany();
  const { categories, error: categoriesError } = useCategories();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [currency, setCurrency] = useState('Rs.');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [flatDiscount, setFlatDiscount] = useState('0');
  const [heldSales, setHeldSales] = useState([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [heldOpen, setHeldOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', reference_no: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [productRes, customerRes, settingsRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers'),
        api.get('/settings')
      ]);
      setProducts(productRes.data.products || []);
      setCustomers(customerRes.data.customers || []);
      setCurrency(settingsRes.data.settings?.currency_symbol || 'Rs.');
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load products and customers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const customer = customers.find(item => String(item.id) === String(customerId));
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(product => {
      const matchesSearch = !query || [
        product.name, product.sku, product.barcode, product.brand, product.category_name
      ].some(value => String(value || '').toLowerCase().includes(query));
      const matchesCategory = !activeCategory || String(product.category_id) === String(activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, search, activeCategory]);
  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    return customers.filter(item => !query || [item.name, item.company, item.phone]
      .some(value => String(value || '').toLowerCase().includes(query)));
  }, [customers, customerSearch]);

  const totals = useMemo(() => {
    let grossSubtotal = 0;
    let itemDiscount = 0;
    let tax = 0;
    for (const item of cart) {
      const gross = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      const discount = gross * (Number(item.discount_percent) || 0) / 100;
      grossSubtotal += gross;
      itemDiscount += discount;
      tax += (gross - discount) * (Number(item.tax_percent) || 0) / 100;
    }
    const invoiceSubtotal = grossSubtotal - itemDiscount;
    const flat = Math.max(0, Number(flatDiscount) || 0);
    return {
      grossSubtotal,
      itemDiscount,
      invoiceSubtotal,
      flatDiscount: Math.min(flat, invoiceSubtotal),
      tax,
      total: Math.max(0, invoiceSubtotal - flat + tax)
    };
  }, [cart, flatDiscount]);

  const addProduct = useCallback((product) => {
    if (Number(product.stock_qty) <= 0) return;
    setCart(current => {
      const existing = current.find(item => String(item.product_id) === String(product.id));
      if (existing) {
        return current.map(item => item === existing
          ? { ...item, quantity: Math.min(Number(item.quantity) + 1, Number(product.stock_qty)) }
          : item);
      }
      return [...current, {
        product_id: product.id,
        description: product.name,
        quantity: 1,
        unit_price: Number(product.sale_price) || 0,
        discount_percent: 0,
        tax_percent: Number(product.tax_percent) || 0,
        stock_qty: Number(product.stock_qty) || 0
      }];
    });
  }, []);

  function updateCartItem(productId, patch) {
    setCart(current => current.map(item => String(item.product_id) === String(productId)
      ? { ...item, ...patch }
      : item));
  }

  function removeCartItem(productId) {
    setCart(current => current.filter(item => String(item.product_id) !== String(productId)));
  }

  function openPayment() {
    setError('');
    setPaymentForm(form => ({ ...form, amount: totals.total.toFixed(2) }));
    setPaymentOpen(true);
  }

  function holdSale() {
    if (cart.length === 0) return;
    setHeldSales(current => [...current, {
      id: `${Date.now()}-${Math.random()}`,
      cart,
      customerId,
      flatDiscount,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setCart([]);
    setCustomerId('');
    setFlatDiscount('0');
    setError('');
  }

  function resumeSale(saleId) {
    const sale = heldSales.find(item => item.id === saleId);
    if (!sale) return;
    if (cart.length > 0 && !window.confirm('Replace the current cart with this held sale? The current cart will be held first.')) return;
    if (cart.length > 0) holdSale();
    setCart(sale.cart);
    setCustomerId(sale.customerId);
    setFlatDiscount(sale.flatDiscount);
    setHeldSales(current => current.filter(item => item.id !== saleId));
    setHeldOpen(false);
  }

  async function completeSale(event) {
    event.preventDefault();
    setError('');
    if (!customerId || !customers.some(item => String(item.id) === String(customerId))) {
      setError('Select a customer before completing this sale.');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one product to the cart.');
      return;
    }
    if (cart.some(item => (Number(item.discount_percent) || 0) < 0 || (Number(item.discount_percent) || 0) > 100)) {
      setError('Item discounts must be between 0 and 100 percent.');
      return;
    }
    if ((Number(flatDiscount) || 0) > totals.invoiceSubtotal) {
      setError('Flat discount cannot exceed the subtotal after item discounts.');
      return;
    }
    const paidAmount = Number(paymentForm.amount) || 0;
    if (paidAmount < 0 || paidAmount > totals.total) {
      setError('Payment must be between zero and the sale total.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/invoices', {
        doc_type: 'bill',
        customer_id: customerId,
        date: todayISO(),
        due_date: '',
        discount_type: 'fixed',
        discount_value: totals.flatDiscount,
        shipping_amount: 0,
        terms: '',
        notes: '',
        items: cart.map(({ product_id, description, quantity, unit_price, discount_percent, tax_percent }) => ({
          product_id,
          description,
          quantity,
          unit_price,
          discount_percent: Number(discount_percent) || 0,
          tax_percent
        }))
      });
      const invoiceId = data.invoice.id;
      if (paidAmount > 0) {
        try {
          await api.post('/payments', {
            customer_id: customerId,
            invoice_id: invoiceId,
            amount: paidAmount,
            method: paymentForm.method,
            reference_no: paymentForm.reference_no,
            date: todayISO(),
            notes: 'POS sale'
          });
        } catch (paymentError) {
          setPaymentOpen(false);
          setCart([]);
          setFlatDiscount('0');
          navigate(`/invoices/${invoiceId}`, {
            state: { posPaymentError: apiErrorMessage(paymentError, 'Bill created, but payment could not be recorded.') }
          });
          return;
        }
      }
      navigate(`/invoices/${invoiceId}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create bill.'));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setCustomerOpen(false);
        setHeldOpen(false);
        setPaymentOpen(false);
        return;
      }
      if (customerOpen || heldOpen || paymentOpen) return;
      if (event.key === 'F2') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'F3') {
        event.preventDefault();
        setCustomerOpen(true);
      } else if (event.key === 'F4') {
        event.preventDefault();
        if (cart.length > 0) openPayment();
      } else if (event.key === 'F5') {
        event.preventDefault();
        holdSale();
      } else if (event.key === 'F6') {
        event.preventDefault();
        setHeldOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;
  }

  return (
    <div className="pos-page">
      <header className="pos-header">
        <div className="flex items-center gap-3 min-w-0">
          <div className="pos-header-icon"><ShoppingCart size={19} /></div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg text-ink-900">Point of Sale</h1>
            <p className="text-xs text-ink-700/55 truncate">{companyName || 'Your Company'}{tagline ? ` · ${tagline}` : ''}</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-ink-700/70">
          <span className="h-2 w-2 rounded-full bg-accent-green" /> Ready
        </span>
        <time className="ml-auto text-xs text-ink-700/60">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</time>
      </header>

      <div className="pos-workspace">
        <section className="pos-products-column">
          <label className="pos-search">
            <Search size={17} className="shrink-0 text-ink-700/45" />
            <input
              ref={searchRef}
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search products by name, SKU or brand… (F2)"
              aria-label="Search products"
            />
            <Barcode size={17} className="shrink-0 text-ink-700/35" />
          </label>

          <div className="pos-category-list" aria-label="Product categories">
            <button type="button" className={`pos-category ${!activeCategory ? 'pos-category-active' : ''}`} onClick={() => setActiveCategory('')}>All</button>
            {categories.map(category => (
              <button
                type="button"
                key={category.id}
                className={`pos-category ${String(activeCategory) === String(category.id) ? 'pos-category-active' : ''}`}
                onClick={() => setActiveCategory(String(category.id))}
              >
                {category.name}
              </button>
            ))}
          </div>
          {loadError && <p className="text-sm text-accent-red">{loadError} <button type="button" className="underline" onClick={loadData}>Retry</button></p>}
          {categoriesError && <p className="text-sm text-accent-red">{categoriesError}</p>}

          {filteredProducts.length === 0 ? (
            <Card className="pos-empty">
              <Package size={28} className="text-ink-700/25" />
              <p>{products.length ? 'No products match your search.' : 'No products available. Add products to start a sale.'}</p>
              {!products.length && <Link to="/products/new" className="text-sm text-brand-700 hover:underline">Add a product</Link>}
            </Card>
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map(product => {
                const image = product.images?.find(item => item.is_primary) || product.images?.[0];
                const inStock = Number(product.stock_qty) > 0;
                return (
                  <button
                    type="button"
                    key={product.id}
                    className="pos-product-card"
                    disabled={!inStock}
                    onClick={() => addProduct(product)}
                    title={inStock ? `Add ${product.name} to cart` : 'Out of stock'}
                  >
                    <span className="pos-product-image">
                      {image
                        ? <img src={`${API_ORIGIN}${image.file_path}`} alt="" loading="lazy" />
                        : <Package size={34} className="text-ink-700/20" />}
                      {!inStock && <span className="pos-stock-badge">Out of stock</span>}
                    </span>
                    <span className="pos-product-name">{product.name}</span>
                    <span className="pos-product-sub">{product.brand || product.category_name || product.sku || ' '}</span>
                    <span className="pos-product-footer">
                      <strong>{formatMoney(product.sale_price, currency)}</strong>
                      <span>{product.stock_qty} pcs</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="pos-checkout-column">
          <Card className="pos-checkout">
            <div className="pos-customer-head">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-ink-900 truncate">{customer?.name || 'Walk-in Customer'}</h2>
                <p className="text-xs text-ink-700/55">{customer ? customer.phone || 'Selected customer' : 'Choose a customer for this bill'}</p>
              </div>
              <button type="button" className="pos-small-button" onClick={() => { setCustomerSearch(''); setCustomerOpen(true); }}>
                <UserRound size={14} /> Customer (F3)
              </button>
            </div>

            <div className="pos-cart-list">
              {cart.length === 0 ? (
                <div className="pos-cart-empty">
                  <ShoppingCart size={25} className="mb-2 text-ink-700/25" />
                  <p>Cart is empty — search and click a product</p>
                </div>
              ) : cart.map(item => (
                <div className="pos-cart-item" key={item.product_id}>
                  <div className="pos-cart-item-info">
                    <p className="font-medium text-sm text-ink-900">{item.description}</p>
                    <p className="text-xs text-ink-700/55">{formatMoney(item.unit_price, currency)} each</p>
                    <label className="pos-item-discount">
                      Item discount
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        aria-label={`Discount percentage for ${item.description}`}
                        value={item.discount_percent}
                        onChange={event => updateCartItem(item.product_id, { discount_percent: event.target.value })}
                        onBlur={() => {
                          const discount = Math.min(100, Math.max(0, Number(item.discount_percent) || 0));
                          updateCartItem(item.product_id, { discount_percent: discount });
                        }}
                      />
                      %
                    </label>
                  </div>
                  <div className="pos-cart-item-controls">
                    <button type="button" aria-label={`Decrease ${item.description}`} onClick={() => item.quantity <= 1 ? removeCartItem(item.product_id) : updateCartItem(item.product_id, { quantity: Number(item.quantity) - 1 })}>
                      {item.quantity <= 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock_qty}
                      aria-label={`Quantity for ${item.description}`}
                      value={item.quantity}
                      onChange={event => {
                        const quantity = Math.min(item.stock_qty, Math.max(1, Number(event.target.value) || 1));
                        updateCartItem(item.product_id, { quantity });
                      }}
                    />
                    <button type="button" aria-label={`Increase ${item.description}`} disabled={Number(item.quantity) >= item.stock_qty} onClick={() => updateCartItem(item.product_id, { quantity: Number(item.quantity) + 1 })}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <strong className="pos-cart-line-total">{formatMoney((Number(item.quantity) || 0) * (Number(item.unit_price) || 0) * (1 - (Number(item.discount_percent) || 0) / 100) * (1 + (Number(item.tax_percent) || 0) / 100), currency)}</strong>
                </div>
              ))}
            </div>

            <div className="pos-summary">
              <SummaryRow label="Subtotal" value={formatMoney(totals.grossSubtotal, currency)} />
              <SummaryRow label="Item Discount" value={`- ${formatMoney(totals.itemDiscount, currency)}`} />
              <label className="pos-summary-row">
                <span>Flat discount</span>
                <input type="number" min="0" max={totals.invoiceSubtotal} step="0.01" value={flatDiscount} onChange={event => setFlatDiscount(event.target.value)} aria-label="Flat discount" />
              </label>
              <SummaryRow label="GST (Exclusive)" value={formatMoney(totals.tax, currency)} />
              <div className="pos-total-row"><span>Total</span><strong>{formatMoney(totals.total, currency)}</strong></div>
            </div>

            {error && <p className="pos-error" role="alert">{error}</p>}
            <div className="pos-actions">
              <button type="button" className="pos-action-button" onClick={holdSale} disabled={!cart.length}><Clock3 size={15} /> Hold (F5)</button>
              <button type="button" className="pos-action-button" onClick={() => setHeldOpen(true)}>Held ({heldSales.length}) F6</button>
              <button type="button" className="pos-payment-button" onClick={openPayment} disabled={!cart.length || saving}>
                Payment (F4) <span>{formatMoney(totals.total, currency)}</span>
              </button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={customerOpen} onClose={() => setCustomerOpen(false)} title="Select Customer">
        <div className="space-y-3">
          <label className="pos-modal-search"><Search size={16} /><input autoFocus value={customerSearch} onChange={event => setCustomerSearch(event.target.value)} placeholder="Search name or phone" /></label>
          <div className="pos-customer-results">
            {filteredCustomers.map(item => (
              <button type="button" key={item.id} className={`pos-customer-option ${String(item.id) === String(customerId) ? 'pos-customer-selected' : ''}`}
                onClick={() => { setCustomerId(String(item.id)); setCustomerOpen(false); }}>
                <span className="pos-customer-avatar"><CircleUserRound size={18} /></span>
                <span className="min-w-0 flex-1 text-left"><strong className="block truncate">{item.name}</strong><small>{item.phone || item.customer_type || 'Customer'}</small></span>
                {String(item.id) === String(customerId) && <Check size={17} />}
              </button>
            ))}
            {filteredCustomers.length === 0 && <p className="py-8 text-center text-sm text-ink-700/55">No customers found.</p>}
          </div>
          <Link to="/customers?new=1" className="block text-center text-sm text-brand-700 hover:underline" onClick={() => setCustomerOpen(false)}>
            Add a new customer
          </Link>
          <Button type="button" variant="outline" className="w-full" onClick={() => setCustomerOpen(false)}><X size={15} /> Close</Button>
        </div>
      </Modal>

      <Modal open={heldOpen} onClose={() => setHeldOpen(false)} title="Held Sales">
        <div className="space-y-2">
          {heldSales.map((sale, index) => {
            const heldCustomer = customers.find(item => String(item.id) === String(sale.customerId));
            const count = sale.cart.reduce((sum, item) => sum + Number(item.quantity), 0);
            return (
              <div key={sale.id} className="pos-held-row">
                <div><strong>Sale {index + 1}</strong><p>{heldCustomer?.name || 'Walk-in Customer'} · {count} item(s) · {sale.heldAt}</p></div>
                <button type="button" onClick={() => resumeSale(sale.id)}>Resume <ChevronDown size={14} /></button>
              </div>
            );
          })}
          {heldSales.length === 0 && <p className="py-8 text-center text-sm text-ink-700/55">No held sales.</p>}
          <Button type="button" variant="outline" className="w-full" onClick={() => setHeldOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Complete Sale">
        <form onSubmit={completeSale} className="space-y-4">
          <div className="rounded-xl bg-surface-soft p-4 text-sm">
            <div className="flex justify-between"><span>Customer</span><strong>{customer?.name || 'Not selected'}</strong></div>
            <div className="mt-2 flex justify-between text-base"><span>Total due</span><strong>{formatMoney(totals.total, currency)}</strong></div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-700/80">Amount received</span>
            <input className="pos-payment-input" type="number" min="0" max={totals.total} step="0.01" required value={paymentForm.amount}
              onChange={event => setPaymentForm(form => ({ ...form, amount: event.target.value }))} />
            <span className="mt-1 block text-xs text-ink-700/55">Enter 0 to save the bill as unpaid.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-700/80">Payment method</span>
            <select className="pos-payment-input" value={paymentForm.method} onChange={event => setPaymentForm(form => ({ ...form, method: event.target.value }))}>
              {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-700/80">Reference number (optional)</span>
            <input className="pos-payment-input" value={paymentForm.reference_no} onChange={event => setPaymentForm(form => ({ ...form, reference_no: event.target.value }))} />
          </label>
          {error && <p className="text-sm text-accent-red" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Bill'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return <div className="pos-summary-row"><span>{label}</span><span>{value}</span></div>;
}
