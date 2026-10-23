import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '../lib/format';
import { Button, Input, Select } from './ui';

// items: [{ product_id, description, quantity, unit_price, discount_percent, tax_percent }]
export default function LineItemsEditor({ items, onChange, products, currencySymbol = 'Rs.', priceField = 'sale_price' }) {
  function updateItem(idx, patch) {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  }

  function addItem() {
    onChange([...items, { product_id: '', description: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_percent: 0 }]);
  }

  function removeItem(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function selectProduct(idx, productId) {
    const product = products.find(p => String(p.id) === String(productId));
    if (product) {
      updateItem(idx, {
        product_id: product.id,
        description: product.name,
        unit_price: product[priceField] ?? product.sale_price ?? 0,
        tax_percent: product.tax_percent || 0
      });
    } else {
      updateItem(idx, { product_id: '' });
    }
  }

  function lineTotal(it) {
    const gross = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const afterDisc = gross - (gross * (Number(it.discount_percent) || 0) / 100);
    const tax = afterDisc * (Number(it.tax_percent) || 0) / 100;
    return afterDisc + tax;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-ink-700/50 uppercase">
              <th className="pb-2 font-medium w-64">Product / Description</th>
              <th className="pb-2 font-medium w-20">Qty</th>
              <th className="pb-2 font-medium w-32">Unit Price</th>
              <th className="pb-2 font-medium w-20">Disc %</th>
              <th className="pb-2 font-medium w-20">Tax %</th>
              <th className="pb-2 font-medium w-32 text-right">Amount</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx} className="border-t border-surface-border">
                <td className="py-2 pr-2">
                  <Select value={it.product_id || ''} onChange={e => selectProduct(idx, e.target.value)} className="mb-1.5">
                    <option value="">— Custom line item —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock_qty} in stock)</option>)}
                  </Select>
                  <input
                    value={it.description}
                    onChange={e => updateItem(idx, { description: e.target.value })}
                    placeholder="Description"
                    className="w-full h-8 px-2 rounded-lg bg-surface-soft border border-surface-border text-xs outline-none focus:border-brand-500"
                  />
                </td>
                <td className="py-2 pr-2 align-top">
                  <Input type="number" min="0" step="0.01" value={it.quantity} onChange={e => updateItem(idx, { quantity: e.target.value })} className="h-9" />
                </td>
                <td className="py-2 pr-2 align-top">
                  <Input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => updateItem(idx, { unit_price: e.target.value })} className="h-9" />
                </td>
                <td className="py-2 pr-2 align-top">
                  <Input type="number" min="0" max="100" step="0.01" value={it.discount_percent} onChange={e => updateItem(idx, { discount_percent: e.target.value })} className="h-9" />
                </td>
                <td className="py-2 pr-2 align-top">
                  <Input type="number" min="0" step="0.01" value={it.tax_percent} onChange={e => updateItem(idx, { tax_percent: e.target.value })} className="h-9" />
                </td>
                <td className="py-2 pr-2 align-top text-right font-mono-num font-medium pt-4">
                  {formatMoney(lineTotal(it), currencySymbol)}
                </td>
                <td className="py-2 align-top pt-3">
                  <button type="button" onClick={() => removeItem(idx)} className="w-7 h-7 rounded-lg hover:bg-accent-redLight hover:text-accent-red flex items-center justify-center text-ink-700/40">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus size={14} /> Add Line Item</Button>
    </div>
  );
}
