import { useEffect, useState, useCallback, useMemo } from 'react';
import { BookOpen, Download, ArrowLeft, MessageCircle } from 'lucide-react';
import api, { apiErrorMessage, openAuthFile } from '../lib/api';
import { useCompany } from '../lib/CompanyContext';
import { formatMoney, formatDate, buildWhatsAppLink } from '../lib/format';
import { Card, Badge, Button, Input, EmptyState, Spinner } from '../components/ui';

export default function Ledger() {
  const [overview, setOverview] = useState(null);
  const [selected, setSelected] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [statement, setStatement] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { brandLabel } = useCompany();

  const [listError, setListError] = useState('');

  const loadOverview = useCallback(() => {
    setLoading(true);
    api.get('/ledger')
      .then(res => {
        setOverview(res.data);
        setListError('');
      })
      .catch(err => {
        setOverview(null);
        setListError(apiErrorMessage(err, 'Could not load the ledger.'));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const parties = useMemo(() => {
    const customers = (overview?.customers || []).map(c => ({ ...c, kind: c.kind || 'customer' }));
    const suppliers = (overview?.suppliers || []).map(s => ({ ...s, kind: 'supplier' }));
    return [...customers, ...suppliers].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [overview]);

  function openParty(party) {
    setSelected(party);
    setStatement(null);
    setCustomerDetail(null);
    if (party.kind === 'customer') {
      api.get(`/customers/${party.id}`).then(res => setCustomerDetail(res.data.customer));
    }
    loadStatement(party);
  }

  function loadStatement(party = selected, from = dateFrom, to = dateTo) {
    if (!party) return;
    const path = party.kind === 'supplier' ? `/ledger/supplier/${party.id}` : `/ledger/${party.id}`;
    api.get(path, { params: { from: from || undefined, to: to || undefined } }).then(res => setStatement(res.data));
  }

  function applyFilter() {
    if (selected) loadStatement(selected);
  }

  async function handleOpenPdf() {
    if (!selected || selected.kind === 'supplier') return;
    setPdfLoading(true);
    try {
      const qs = dateFrom || dateTo ? `?from=${dateFrom}&to=${dateTo}` : '';
      await openAuthFile(`/pdf/ledger/${selected.id}${qs}`, {
        filename: `${selected.name.replace(/\s+/g, '_')}_statement.pdf`,
      });
    } catch (err) {
      alert(err.message || apiErrorMessage(err, 'Could not generate PDF statement. Please try again.'));
    } finally {
      setPdfLoading(false);
    }
  }

  if (selected) {
    const waLink = selected.kind === 'customer' && customerDetail?.whatsapp ? buildWhatsAppLink(
      customerDetail.whatsapp,
      brandLabel
        ? `Hi ${customerDetail.name}, here is your account statement from ${brandLabel}.`
        : `Hi ${customerDetail.name}, here is your account statement.`
    ) : null;
    return (
      <div className="space-y-6">
        <button onClick={() => { setSelected(null); setStatement(null); setCustomerDetail(null); }} className="flex items-center gap-1.5 text-sm text-ink-700/60 hover:text-brand-700">
          <ArrowLeft size={15} /> Back to Ledger Overview
        </button>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-ink-900">{selected.name}</h1>
            <p className="text-sm text-ink-700/60 mt-0.5">
              {selected.kind === 'supplier' ? 'Supplier account statement' : 'Customer account statement'}
            </p>
          </div>
          <div className="flex gap-2">
            {selected.kind !== 'supplier' && (
              <Button variant="outline" onClick={handleOpenPdf} disabled={pdfLoading}>
                {pdfLoading ? <Spinner size={15} /> : <Download size={15} />}
                {pdfLoading ? 'Generating…' : 'PDF Statement'}
              </Button>
            )}
            {waLink && <a href={waLink} target="_blank" rel="noreferrer"><Button variant="secondary"><MessageCircle size={15} /> WhatsApp</Button></a>}
          </div>
        </div>

        <Card className="p-4 flex flex-wrap items-end gap-3">
          <Input label="From date" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-44" />
          <Input label="To date" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-44" />
          <Button variant="outline" onClick={applyFilter}>Apply Filter</Button>
          {(dateFrom || dateTo) && <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); loadStatement(selected, '', ''); }}>Clear</Button>}
        </Card>

        {!statement ? (
          <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
        ) : (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-ink-700/60">{statement.entries.length} entries</p>
              <p className="text-sm font-semibold">Current Balance: <span className={`font-mono-num ${statement.currentBalance > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{formatMoney(statement.currentBalance)}</span></p>
            </div>
            {statement.entries.length === 0 ? (
              <EmptyState icon={BookOpen} title="No entries in this period" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                      <th className="py-2 font-medium">Date</th>
                      <th className="py-2 font-medium">Description</th>
                      <th className="py-2 font-medium text-right">Debit</th>
                      <th className="py-2 font-medium text-right">Credit</th>
                      <th className="py-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {statement.entries.map(e => (
                      <tr key={e.id}>
                        <td className="py-2.5 text-ink-700/70">{formatDate(e.entry_date)}</td>
                        <td className="py-2.5 text-ink-800">{e.description || e.reference_type}</td>
                        <td className="py-2.5 text-right font-mono-num text-accent-red">{e.type === 'debit' ? formatMoney(e.amount) : ''}</td>
                        <td className="py-2.5 text-right font-mono-num text-accent-green">{e.type === 'credit' ? formatMoney(e.amount) : ''}</td>
                        <td className="py-2.5 text-right font-mono-num font-semibold">{formatMoney(e.running_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Company Ledger Overview</h1>
        <p className="text-sm text-ink-700/60 mt-0.5">Customer and supplier balances — click a name to open the statement</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-brand-700"><Spinner size={26} /></div>
      ) : listError ? (
        <Card className="p-6 text-center space-y-3">
          <p className="text-sm text-accent-red">{listError}</p>
          <Button variant="outline" onClick={loadOverview}>Retry</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Receivable</p><p className="font-mono-num font-bold text-xl text-accent-red">{formatMoney(overview?.summary?.totalReceivable)}</p></Card>
            <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Advance / Credit</p><p className="font-mono-num font-bold text-xl text-accent-green">{formatMoney(overview?.summary?.totalAdvance)}</p></Card>
            <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Total Payable</p><p className="font-mono-num font-bold text-xl text-accent-red">{formatMoney(overview?.summary?.totalPayable)}</p></Card>
            <Card className="p-5"><p className="text-xs text-ink-700/50 mb-1">Net Outstanding</p><p className="font-mono-num font-bold text-xl">{formatMoney(overview?.summary?.netOutstanding)}</p></Card>
          </div>

          <Card className="overflow-hidden">
            {parties.length === 0 ? (
              <EmptyState icon={BookOpen} title="No ledger accounts yet" description="Add a customer or supplier to start tracking their ledger." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs text-ink-700/50 uppercase">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Type</th>
                      <th className="px-5 py-3 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {parties.map(party => (
                      <tr key={`${party.kind}-${party.id}`} onClick={() => openParty(party)} className="hover:bg-surface-soft/60 cursor-pointer transition-colors">
                        <td className="px-5 py-3 font-medium text-ink-900">{party.name}</td>
                        <td className="px-5 py-3">
                          <Badge tone={party.kind === 'supplier' ? 'amber' : 'brand'}>
                            {party.kind === 'supplier' ? 'Supplier' : (party.customer_type || 'Customer')}
                          </Badge>
                        </td>
                        <td className={`px-5 py-3 text-right font-mono-num font-semibold ${party.current_balance > 0 ? 'text-accent-red' : 'text-accent-green'}`}>{formatMoney(party.current_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
