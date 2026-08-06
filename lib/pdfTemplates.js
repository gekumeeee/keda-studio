'use client';

// PDF document definitions for the admin's Invoices, Plans and Contracts tabs.
// Kept in its own module so admin/page.js can `import()` it lazily on click
// instead of bundling @react-pdf/renderer (a heavy library) into the initial
// admin page load.

import { Document, Page, View, Text, Image, Font, StyleSheet, pdf } from '@react-pdf/renderer';
import { formatAmount, invoiceTotals, contractTotal } from '@/lib/invoiceMath';

const INK = '#171A1D';
const DIM = '#6B7580';
const ACCENT = '#2F3A44';
const LINE = '#D9D6D5';

let fontsRegistered = false;
function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: 'Bricolage Grotesque',
    fonts: [
      { src: '/fonts/BricolageGrotesque-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/BricolageGrotesque-Bold.ttf', fontWeight: 700 },
      { src: '/fonts/BricolageGrotesque-ExtraBold.ttf', fontWeight: 800 },
    ],
  });
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Bricolage Grotesque', fontSize: 11, color: INK },
  h1: { fontSize: 46, fontWeight: 800, color: ACCENT, letterSpacing: -1 },
  metaLabel: { fontWeight: 700 },
  meta: { fontSize: 12, marginTop: 14 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36, marginBottom: 14 },
  sectionHeadLeft: { fontSize: 15, fontWeight: 800, color: ACCENT },
  sectionHeadRight: { fontSize: 15, fontWeight: 800, color: ACCENT, width: 110, textAlign: 'right' },
  row: { flexDirection: 'row', marginBottom: 22 },
  rowLeft: { flex: 1, paddingRight: 20 },
  rowDivider: { width: 1, backgroundColor: LINE, marginRight: 20 },
  rowRight: { width: 90, textAlign: 'right' },
  itemTitle: { fontSize: 13, fontWeight: 700 },
  bullet: { fontSize: 10.5, color: INK, marginTop: 6, lineHeight: 1.4 },
  price: { fontSize: 13, fontWeight: 700 },
  hr: { borderBottomWidth: 1, borderBottomColor: LINE, marginTop: 6, marginBottom: 22 },
  totalsBlock: { marginBottom: 14 },
  totalsLabel: { fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsValue: { fontSize: 17, fontWeight: 700, color: INK, marginTop: 2 },
  totalsValueBig: { fontSize: 20, fontWeight: 800, color: INK, marginTop: 2 },
  logo: { position: 'absolute', bottom: 44, right: 48, width: 90, height: 'auto' },
});

function InvoiceDocument({ invoice }) {
  const { subtotal, discount, total } = invoiceTotals(invoice);
  const currency = invoice.currency || 'LE';
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>INVOICE</Text>
        <Text style={styles.meta}>
          <Text style={styles.metaLabel}>Project: </Text>
          {invoice.projectName}
        </Text>
        {invoice.clientName ? (
          <Text style={styles.meta}>
            <Text style={styles.metaLabel}>Client: </Text>
            {invoice.clientName}
          </Text>
        ) : null}

        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionHeadLeft}>Project Deliverables</Text>
          <Text style={styles.sectionHeadRight}>Price</Text>
        </View>

        {(invoice.sections || []).map((s, i) => (
          <View style={styles.row} key={i}>
            <View style={styles.rowLeft}>
              <Text style={styles.itemTitle}>{s.title}</Text>
              {(s.items || []).map((it, j) => (
                <Text style={styles.bullet} key={j}>• {it}</Text>
              ))}
            </View>
            <View style={styles.rowDivider} />
            <Text style={[styles.rowRight, styles.price]}>
              {s.price ? `${s.price} ${currency}` : ''}
            </Text>
          </View>
        ))}

        <View style={styles.hr} />

        <View style={styles.totalsBlock}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>{formatAmount(subtotal)} {currency}</Text>
        </View>
        {discount > 0 ? (
          <View style={styles.totalsBlock}>
            <Text style={styles.totalsLabel}>Discount</Text>
            <Text style={styles.totalsValue}>{formatAmount(discount)} {currency}</Text>
          </View>
        ) : null}
        <View style={styles.totalsBlock}>
          <Text style={styles.totalsLabel}>Total Amount</Text>
          <Text style={styles.totalsValueBig}>{formatAmount(total)} {currency}</Text>
        </View>

        <Image src="/keda-black.png" style={styles.logo} />
      </Page>
    </Document>
  );
}

const planStyles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Bricolage Grotesque', fontSize: 11, color: INK },
  kicker: { fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.4 },
  h1: { fontSize: 40, fontWeight: 800, color: ACCENT, letterSpacing: -0.5, marginTop: 8, lineHeight: 1.05 },
  description: { fontSize: 13, color: DIM, marginTop: 14, lineHeight: 1.55, maxWidth: 460 },
  priceBlock: { marginTop: 32, paddingTop: 26, paddingBottom: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2 },
  priceValue: { fontSize: 34, fontWeight: 800, color: INK },
  priceCycle: { fontSize: 13, fontWeight: 400, color: DIM, marginLeft: 4 },
  includedHead: { fontSize: 12, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 32, marginBottom: 12 },
  bullet: { fontSize: 12, color: INK, marginBottom: 8, lineHeight: 1.45, paddingLeft: 14 },
  bulletMark: { color: ACCENT, fontWeight: 700 },
  logo: { position: 'absolute', bottom: 44, right: 48, width: 90, height: 'auto' },
});

function PlanDocument({ plan }) {
  const currency = plan.currency || 'LE';
  return (
    <Document>
      <Page size="A4" style={planStyles.page}>
        <Text style={planStyles.kicker}>Plan</Text>
        <Text style={planStyles.h1}>{plan.name}</Text>
        {plan.description ? <Text style={planStyles.description}>{plan.description}</Text> : null}

        {plan.price ? (
          <View style={planStyles.priceBlock}>
            <Text style={planStyles.priceLabel}>Price</Text>
            <Text style={planStyles.priceValue}>
              {plan.price} {currency}
              {plan.cycle ? <Text style={planStyles.priceCycle}> / {plan.cycle}</Text> : null}
            </Text>
          </View>
        ) : null}

        {plan.items && plan.items.length > 0 ? (
          <>
            <Text style={planStyles.includedHead}>What&apos;s included</Text>
            {plan.items.map((it, i) => (
              <Text style={planStyles.bullet} key={i}>
                <Text style={planStyles.bulletMark}>—  </Text>
                {it}
              </Text>
            ))}
          </>
        ) : null}

        <Image src="/keda-black.png" style={planStyles.logo} />
      </Page>
    </Document>
  );
}

const STUDIO_NAME = 'KEDA — Brand & Creative Studio';
const contractStyles = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 96, paddingHorizontal: 48, fontFamily: 'Bricolage Grotesque', fontSize: 11, color: INK },
  kicker: { fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.4 },
  h1: { fontSize: 34, fontWeight: 800, color: ACCENT, letterSpacing: -0.5, marginTop: 8, lineHeight: 1.05 },
  parties: { fontSize: 12, color: INK, marginTop: 18, lineHeight: 1.6 },
  partiesStrong: { fontWeight: 700 },
  metaRow: { flexDirection: 'row', gap: 40, marginTop: 16 },
  metaCell: {},
  metaLabel: { fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
  metaValue: { fontSize: 12, color: INK, marginTop: 3 },
  sectionHead: { fontSize: 12, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 34, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 8 },
  scopeHeadRow: { flexDirection: 'row', marginBottom: 8 },
  scopeHeadLabel: { flex: 1, fontSize: 9, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6 },
  scopeHeadQty: { width: 80, fontSize: 9, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
  scopeHeadAmt: { width: 90, fontSize: 9, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right' },
  scopeRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: LINE, alignItems: 'center' },
  scopeLabel: { flex: 1, fontSize: 12, fontWeight: 700, color: INK, paddingRight: 12 },
  scopeQty: { width: 80, fontSize: 12, color: INK, textAlign: 'center' },
  scopeAmt: { width: 90, fontSize: 12, fontWeight: 700, color: INK, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 },
  totalLabel: { fontSize: 12, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 22, fontWeight: 800, color: INK },
  para: { fontSize: 11, color: INK, lineHeight: 1.6, marginBottom: 9 },
  signRow: { position: 'absolute', bottom: 48, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  signCell: { width: '42%' },
  signLine: { borderTopWidth: 1, borderTopColor: INK, paddingTop: 6 },
  signName: { fontSize: 11, fontWeight: 700, color: INK },
  signRole: { fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },
  logo: { position: 'absolute', top: 44, right: 48, width: 74, height: 'auto' },
});

function ContractDocument({ contract }) {
  const currency = contract.currency || 'LE';
  const total = contractTotal(contract);
  const hasAmounts = (contract.items || []).some((it) => it.amount && it.amount.trim());
  const partyRoleLabel = contract.partyType === 'employee' ? 'Team Member' : 'Client';
  const termsParas = (contract.terms || '').split('\n').filter((l) => l.trim());
  const noteParas = (contract.notes || '').split('\n').filter((l) => l.trim());
  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Document>
      <Page size="A4" style={contractStyles.page}>
        <Image src="/keda-black.png" style={contractStyles.logo} />
        <Text style={contractStyles.kicker}>Contract</Text>
        <Text style={contractStyles.h1}>{contract.title}</Text>

        <Text style={contractStyles.parties}>
          This agreement is made between <Text style={contractStyles.partiesStrong}>{STUDIO_NAME}</Text>
          {contract.partyName ? (
            <>
              {' '}and <Text style={contractStyles.partiesStrong}>{contract.partyName}</Text>
              {` (the ${partyRoleLabel})`}
            </>
          ) : null}.
        </Text>

        {(contract.role || contract.startDate || contract.endDate) ? (
          <View style={contractStyles.metaRow}>
            {contract.role ? (
              <View style={contractStyles.metaCell}>
                <Text style={contractStyles.metaLabel}>Role</Text>
                <Text style={contractStyles.metaValue}>{contract.role}</Text>
              </View>
            ) : null}
            {contract.startDate ? (
              <View style={contractStyles.metaCell}>
                <Text style={contractStyles.metaLabel}>Start</Text>
                <Text style={contractStyles.metaValue}>{fmtDate(contract.startDate)}</Text>
              </View>
            ) : null}
            {contract.endDate ? (
              <View style={contractStyles.metaCell}>
                <Text style={contractStyles.metaLabel}>End</Text>
                <Text style={contractStyles.metaValue}>{fmtDate(contract.endDate)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {(contract.items || []).length > 0 ? (
          <>
            <Text style={contractStyles.sectionHead}>Scope of Work</Text>
            <View style={contractStyles.scopeHeadRow}>
              <Text style={contractStyles.scopeHeadLabel}>Item</Text>
              <Text style={contractStyles.scopeHeadQty}>Qty</Text>
              {hasAmounts ? <Text style={contractStyles.scopeHeadAmt}>Amount</Text> : null}
            </View>
            {contract.items.map((it, i) => (
              <View style={contractStyles.scopeRow} key={i}>
                <Text style={contractStyles.scopeLabel}>{it.label}</Text>
                <Text style={contractStyles.scopeQty}>{it.quantity || '—'}</Text>
                {hasAmounts ? (
                  <Text style={contractStyles.scopeAmt}>{it.amount ? `${it.amount} ${currency}` : ''}</Text>
                ) : null}
              </View>
            ))}
            {hasAmounts && total > 0 ? (
              <View style={contractStyles.totalRow}>
                <Text style={contractStyles.totalLabel}>Total</Text>
                <Text style={contractStyles.totalValue}>{formatAmount(total)} {currency}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {termsParas.length > 0 ? (
          <>
            <Text style={contractStyles.sectionHead}>Terms &amp; Details</Text>
            {termsParas.map((p, i) => <Text style={contractStyles.para} key={i}>{p}</Text>)}
          </>
        ) : null}

        {noteParas.length > 0 ? (
          <>
            <Text style={contractStyles.sectionHead}>Notes</Text>
            {noteParas.map((p, i) => <Text style={contractStyles.para} key={i}>{p}</Text>)}
          </>
        ) : null}

        <View style={contractStyles.signRow} fixed>
          <View style={contractStyles.signCell}>
            <View style={contractStyles.signLine}>
              <Text style={contractStyles.signName}>KEDA</Text>
              <Text style={contractStyles.signRole}>The Studio</Text>
            </View>
          </View>
          <View style={contractStyles.signCell}>
            <View style={contractStyles.signLine}>
              <Text style={contractStyles.signName}>{contract.partyName || ' '}</Text>
              <Text style={contractStyles.signRole}>The {partyRoleLabel}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function downloadInvoicePdf(invoice) {
  registerFonts();
  const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
  triggerDownload(blob, `${(invoice.projectName || 'invoice').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}

export async function downloadPlanPdf(plan) {
  registerFonts();
  const blob = await pdf(<PlanDocument plan={plan} />).toBlob();
  triggerDownload(blob, `${(plan.name || 'plan').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}

export async function downloadContractPdf(contract) {
  registerFonts();
  const blob = await pdf(<ContractDocument contract={contract} />).toBlob();
  triggerDownload(blob, `${(contract.title || 'contract').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
