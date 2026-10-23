import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Layers, ArrowUpDown } from 'lucide-react';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { Card, Button, Select, Badge, EmptyState, Spinner } from '../components/ui';
import { useCategories } from '../hooks/useCategories';

export default function Products() {
  const [products, setProducts] = useState([]);
  const { categories, error: categoriesError } = useCategories();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/products', { params: { search: search || undefined, category_id: categoryFilter || undefined, stock_status: stockFilter || undefined } })
      .then(res => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }, [search, categoryFilter, stockFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">Products</h1>
          <p className="text-sm text-ink-700/60 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventory"><Button variant="outline"><ArrowUpDown size={16} /> Inventory</Button></Link>
          <Link to="/products/new"><Button><Plus size={16} /> Add Product</Button></Link>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SKU, barcode, brand…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-soft border border-surface-border focus:border-brand-500 focus:bg-surface outline-none text-sm text-ink-900 placeholder:text-ink-700/40"
          />
        </div>
        <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="sm:w-56">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="sm:w-44">
          <option value="">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </Select>
      </Card>
      {categoriesError && <p className="text-sm text-accent-red">{categoriesError}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your first product — compressors, lifts, spare parts — to start building quotations and invoices."
            action={<Link to="/products/new"><Button><Plus size={16} /> Add Product</Button></Link>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => {
            const primaryImage = p.images?.find(i => i.is_primary) || p.images?.[0];
            const isLow = p.stock_qty <= p.reorder_level && p.stock_qty > 0;
            const isOut = p.stock_qty <= 0;
            return (
              <Card key={p.id} className="overflow-hidden hover:shadow-cardHover transition-shadow cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
                <div className="aspect-[4/3] bg-surface-soft flex items-center justify-center overflow-hidden relative">
                  {primaryImage ? (
                    <img src={`${api.defaults.baseURL.replace('/api', '')}${primaryImage.file_path}`} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-ink-700/20" />
                  )}
                  {(isLow || isOut) && (
                    <div className="absolute top-2 right-2">
                      <Badge tone="red" className="flex items-center gap-1"><AlertTriangle size={11} /> {isOut ? 'Out of stock' : 'Low stock'}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {p.category_name && <p className="text-[11px] font-medium text-brand-700 mb-0.5">{p.category_name}</p>}
                  <p className="font-medium text-ink-900 text-sm truncate">{p.name}</p>
                  {p.brand && <p className="text-xs text-ink-700/50">{p.brand}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-mono-num font-bold text-ink-900">{formatMoney(p.sale_price)}</span>
                    <span className="text-xs text-ink-700/50 flex items-center gap-1"><Layers size={12} /> {p.stock_qty} in stock</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
