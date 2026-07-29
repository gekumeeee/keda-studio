// Pure helpers shared by the admin's live invoice preview and the PDF
// template. Kept dependency-free (no @react-pdf/renderer import) so the
// admin page can compute totals on every keystroke without pulling the
// heavy PDF library into its bundle — that only loads on actual download.

export function parseAmount(str) {
  const n = Number(String(str ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function formatAmount(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function invoiceTotals(invoice) {
  const subtotal = (invoice.sections || []).reduce((sum, s) => sum + parseAmount(s.price), 0);
  const discount = parseAmount(invoice.discount);
  return { subtotal, discount, total: subtotal - discount };
}
