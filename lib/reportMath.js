// Pure helpers shared by the monthly entry screen (live preview on every
// keystroke) and the report template (final render + PDF) — same shape as
// lib/invoiceMath.js, and for the same reason: the numbers must never drift
// between what the admin sees while typing and what actually prints.

export const METRIC_KEYS = ['reach', 'engagement', 'newFollowers', 'messages', 'ytViews'];

export function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// null means "don't show a percentage" — the template renders that as the
// Arabic baseline label instead of a number. Never divide by zero.
export function changePct(current, previous) {
  const prev = parseNum(previous);
  if (previous === undefined || previous === null || previous === '' || prev === 0) return null;
  return ((parseNum(current) - prev) / prev) * 100;
}

export function engagementRate(engagement, reach) {
  const r = parseNum(reach);
  if (r === 0) return null;
  return (parseNum(engagement) / r) * 100;
}

// deliveredCounts / packageCounts: { [type]: number }. Returns one row per
// type present in the package (a type the client isn't paying for has
// nothing to compare against, so it's left out rather than shown as "+N").
export function deliveryRows(packageCounts, deliveredCounts) {
  return Object.entries(packageCounts || {}).map(([type, agreed]) => {
    const delivered = parseNum((deliveredCounts || {})[type]);
    const diff = delivered - parseNum(agreed);
    const status = diff === 0 ? 'مكتمل' : diff < 0 ? 'ناقص' : `+${diff} إضافي`;
    return { type, agreed: parseNum(agreed), delivered, diff, status };
  });
}

export function renewalAlert(renewalDate, today = new Date()) {
  if (!renewalDate) return false;
  const days = (new Date(renewalDate) - today) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

export function formatPct(n) {
  if (n === null || n === undefined) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function prevMonthKey(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1); // m is 1-based; -2 lands on the previous month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function clientSlug(name) {
  return (name || 'client')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'client';
}

export function reportFileName(clientName, month) {
  return `KEDA-Report_${clientSlug(clientName)}_${month}.pdf`;
}

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function monthLabelAr(month) {
  const [y, m] = month.split('-').map(Number);
  return `${AR_MONTHS[m - 1]} ${y}`;
}
