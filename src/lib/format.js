export function formatMoney(value, symbol = 'Rs.') {
  const n = Number(value || 0);
  return `${symbol} ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Builds a wa.me deep link with a pre-filled message. Opens WhatsApp Web/App;
// the user still needs to manually attach any PDF (WhatsApp does not allow
// programmatic file attachment from a browser link for privacy/security reasons).
export function buildWhatsAppLink(phone, message) {
  const digits = (phone || '').replace(/[^\d]/g, '');
  // Normalize Pakistani numbers: 03xx -> 923xx
  const normalized = digits.startsWith('0') ? `92${digits.slice(1)}` : digits;
  const text = encodeURIComponent(message || '');
  return `https://wa.me/${normalized}?text=${text}`;
}
