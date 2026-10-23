import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, MessageCircle, Pencil, Copy, ArrowRightCircle, Trash2 } from 'lucide-react';
import api, { apiErrorMessage, openAuthFile } from '../lib/api';
import { useCompany } from '../lib/CompanyContext';
import { formatMoney, formatDate, buildWhatsAppLink } from '../lib/format';
import { Card, Badge, Button, Spinner, Select, Modal, Input } from '../components/ui';

const STATUS_TONE = { draft: 'gray', sent: 'brand', accepted: 'green', rejected: 'red', expired: 'amber', converted: 'green' };

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const { brandLabel } = useCompany();

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/quotations/${id}`).then(res => {
      setQuotation(res.data.quotation);
      setItems(res.data.items);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(status) {
    await api.put(`/quotations/${id}/status`, { status });
    load();
  }

  async function handleDuplicate() {
    const { data } = await api.post(`/quotations/${id}/duplicate`);
    navigate(`/quotations/${data.quotation.id}`);
  }

  async function handleDelete() {
    if (!confirm('Delete this quotation?')) return;
    try {
      await api.delete(`/quotations/${id}`);
      navigate('/quotations');
    } catch (err) {
      alert(apiErrorMessage(err, 'Could not delete quotation.'));
    }
  }

  async function handleConvert() {
    setConverting(true);
    setError('');
    try {
      const { data } = await api.post(`/quotations/${id}/convert-to-invoice`, { due_date: dueDate || undefined });
      navigate(`/invoices/${data.invoice.id}`);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not convert to invoice.'));
    } finally {
      setConverting(false);
    }
  }

  async function handleOpenPdf() {
    setPdfLoading(true);
    try {
      await openAuthFile(`/pdf/quotation/${id}`, { filename: `${quotation.quote_number}.pdf` });
    } catch (err) {
      alert(err.message || apiErrorMessage(err, 'Could not generate PDF. Please try again.'));
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading || !quotation) return <div className="flex items-center justify-center h-96 text-brand-700"><Spinner size={28} /></div>;

  const waLink = quotation.customer_whatsapp ? buildWhatsAppLink(
    quotation.customer_whatsapp,
    brandLabel
      ? `Hi ${quotation.customer_name}, please find your quotation ${quotation.quote_number} from ${brandLabel} (Total: ${formatMoney(quotation.total)}). I'll attach the PDF now.`
      : `Hi ${quotation.customer_name}, please find your quotation ${quotation.quote_number} (Total: ${formatMoney(quotation.total)}). I'll attach the PDF now.`
  ) : null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/quotations')} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
        <ArrowLeft size={15} /> Back to Quotations
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl text-ink-900">{quotation.quote_number}</h1>
            <Badge tone={STATUS_TONE[quotation.status]}>{quotation.status}</Badge>
          </div>
          <p className="text-sm text-ink-700/60 mt-0.5">
            <Link to={`/customers/${quotation.customer_id}`} className="hover:text-brand-700">{quotation.customer_name}</Link> · {formatDate(quotation.date)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quotation.status !== 'converted' && (
            <Link to={`/quotations/${id}/edit`}><Button variant="outline"><Pencil size={15} /> Edit</Button></Link>
          )}
          <Button variant="outline" onClick={handleDuplicate}><Copy size={15} /> Duplicate</Button>
          <Button variant="outline" onClick={handleOpenPdf} disabled={pdfLoading}>
            {pdfLoading ? <Spinner size={15} /> : <Download size={15} />}
            {pdfLoading ? 'Generating…' : 'PDF'}
          </Button>
          {waLink && <a href={waLink} target="_blank" rel="noreferrer"><Button variant="secondary"><MessageCircle size={15} /> WhatsApp</Button></a>}
          {quotation.status !== 'converted' && (
            <Button onClick={() => setConvertOpen(true)}><ArrowRightCircle size={15} /> Convert to Invoice</Button>
          )}
          {quotation.status !== 'converted' && (
            <Button variant="danger" onClick={handleDelete}><Trash2 size={15} /></Button>
          )}
        </div>
      </div>

      {quotation.status !== 'converted' && (
        <Card className="p-4 flex items-center gap-3">
          <span className="text-sm text-ink-700/60">Update status:</span>
          <Select value={quotation.status} onChange={e => handleStatusChange(e.target.value)} className="w-44">
            {['draft', 'sent', 'accepted', 'rejected', 'expired'].map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Card>
      )}

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Unit Price</th>
                <th className="py-2 font-medium">Tax</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {items.map(it => (
                <tr key={it.id}>
                  <td className="py-2.5">{it.description}</td>
                  <td className="py-2.5">{it.quantity}</td>
                  <td className="py-2.5 font-mono-num">{formatMoney(it.unit_price)}</td>
                  <td className="py-2.5">{it.tax_percent}%</td>
                  <td className="py-2.5 text-right font-mono-num font-medium">{formatMoney(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <div className="w-64 space-y-1.5 text-sm">
            <Row label="Subtotal" value={formatMoney(quotation.subtotal)} />
            <Row label="Tax" value={formatMoney(quotation.tax_amount)} />
            {quotation.shipping_amount > 0 && <Row label="Shipping" value={formatMoney(quotation.shipping_amount)} />}
            <div className="border-t border-surface-border pt-1.5">
              <Row label="Total" value={formatMoney(quotation.total)} bold />
            </div>
          </div>
        </div>
      </Card>

      {(quotation.terms || quotation.notes) && (
        <Card className="p-6 space-y-3">
          {quotation.terms && <div><p className="text-xs font-semibold text-ink-700/50 mb-1">TERMS &amp; CONDITIONS</p><p className="text-sm text-ink-800">{quotation.terms}</p></div>}
          {quotation.notes && <div><p className="text-xs font-semibold text-ink-700/50 mb-1">NOTES</p><p className="text-sm text-ink-800">{quotation.notes}</p></div>}
        </Card>
      )}

      <Modal open={convertOpen} onClose={() => setConvertOpen(false)} title="Convert to Invoice">
        <div className="space-y-4">
          <p className="text-sm text-ink-700/70">This will create a new invoice with the same items, deduct stock for tracked products, and post the amount to the customer's ledger.</p>
          <Input label="Due date (optional)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          {error && <p className="text-sm text-accent-red bg-accent-redLight rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={converting}>{converting ? 'Converting…' : 'Convert to Invoice'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-ink-700/70 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`font-mono-num ${bold ? 'font-bold text-base text-brand-700' : 'font-medium text-ink-900'}`}>{value}</span>
    </div>
  );
}
