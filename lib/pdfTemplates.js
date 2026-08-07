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

// Contracts render differently depending on partyType: a client agreement
// frames things as services/deliverables sold, a team agreement frames them
// as a role and its responsibilities. Same data shape either way — only the
// section labels and preamble wording change.
const contractStyles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Bricolage Grotesque', fontSize: 11, color: INK },

  // dark branded band across the top (page padding is 0 so it's full-bleed)
  header: { backgroundColor: ACCENT, paddingHorizontal: 48, paddingTop: 34, paddingBottom: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitleCol: { flex: 1, paddingRight: 16 },
  kicker: { fontSize: 10, fontWeight: 700, color: '#AEB7C0', textTransform: 'uppercase', letterSpacing: 2 },
  h1: { fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.4, marginTop: 8, lineHeight: 1.1 },
  logo: { width: 64, height: 'auto' },
  refRow: { flexDirection: 'row', marginTop: 20, gap: 26 },
  refItem: { flexDirection: 'row' },
  refLabel: { fontSize: 8.5, fontWeight: 700, color: '#8791A0', textTransform: 'uppercase', letterSpacing: 1 },
  refValue: { fontSize: 8.5, fontWeight: 700, color: '#E4E8EC', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 },

  // paddingBottom stays small: the fixed footer already reserves visual space,
  // and any extra here overflows into a stray blank page once content is long.
  body: { paddingHorizontal: 48, paddingTop: 24, paddingBottom: 16 },

  sectionHead: { fontSize: 11, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.4, marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 7 },
  sectionHeadFirst: { marginTop: 4 },

  partiesGrid: { flexDirection: 'row', gap: 24 },
  partyCell: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 14 },
  partyLabel: { fontSize: 8.5, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 1 },
  partyName: { fontSize: 13, fontWeight: 700, color: INK, marginTop: 5, lineHeight: 1.25 },
  partyMeta: { fontSize: 10, color: DIM, marginTop: 3 },

  preamble: { fontSize: 11, color: INK, lineHeight: 1.55, marginTop: 14 },

  scopeHeadRow: { flexDirection: 'row', marginBottom: 6 },
  scopeHeadLabel: { flex: 1, fontSize: 8.5, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6 },
  scopeHeadQty: { width: 90, fontSize: 8.5, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
  scopeHeadAmt: { width: 96, fontSize: 8.5, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right' },
  scopeRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: LINE, alignItems: 'center' },
  scopeLabel: { flex: 1, fontSize: 12, fontWeight: 700, color: INK, paddingRight: 12 },
  scopeQty: { width: 90, fontSize: 11, color: INK, textAlign: 'center' },
  scopeAmt: { width: 96, fontSize: 12, fontWeight: 700, color: INK, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 14, paddingTop: 12, borderTopWidth: 2, borderTopColor: ACCENT },
  totalLabel: { fontSize: 11, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 22, fontWeight: 800, color: INK },

  clauseRow: { flexDirection: 'row', marginBottom: 8 },
  clauseNum: { width: 22, fontSize: 11, fontWeight: 800, color: ACCENT },
  clauseText: { flex: 1, fontSize: 11, color: INK, lineHeight: 1.55 },
  para: { fontSize: 11, color: INK, lineHeight: 1.6, marginBottom: 8 },

  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  signCell: { width: '44%' },
  signSpace: { height: 34 },
  signLine: { borderTopWidth: 1, borderTopColor: INK, paddingTop: 6 },
  signName: { fontSize: 11, fontWeight: 700, color: INK },
  signRole: { fontSize: 8.5, color: DIM, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 },

  footer: { position: 'absolute', bottom: 22, left: 48, right: 48, textAlign: 'center', fontSize: 8, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 1.4 },
});

function ContractDocument({ contract }) {
  const isTeam = contract.partyType === 'employee';
  const currency = contract.currency || 'LE';
  const total = contractTotal(contract);
  const hasAmounts = (contract.items || []).some((it) => it.amount && it.amount.trim());
  const partyLabel = isTeam ? 'Team Member' : 'Client';
  const agreementLabel = isTeam ? 'Team Agreement' : 'Client Agreement';
  const scopeHeadLabel = isTeam ? 'Role & Responsibilities' : 'Scope of Work & Deliverables';
  const totalLabel = isTeam ? 'Compensation' : 'Total Investment';
  const termsClauses = (contract.terms || '').split('\n').filter((l) => l.trim());
  const noteParas = (contract.notes || '').split('\n').filter((l) => l.trim());
  const ref = (contract.id || '').slice(-6).toUpperCase();

  const fmtDate = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const issued = fmtDate(contract.updated) || fmtDate(new Date().toISOString());
  const period = [
    contract.startDate ? `effective ${fmtDate(contract.startDate)}` : '',
    contract.endDate ? `until ${fmtDate(contract.endDate)}` : '',
  ].filter(Boolean).join(' ');
  const preamble = isTeam
    ? `This agreement sets out the working arrangement between ${STUDIO_NAME} and ${contract.partyName || 'the Team Member'}${contract.role ? ` as ${contract.role}` : ''}${period ? `, ${period}` : ''}.`
    : `This agreement sets out the services ${STUDIO_NAME} will provide to ${contract.partyName || 'the Client'}${period ? `, ${period}` : ''}.`;

  return (
    <Document>
      <Page size="A4" style={contractStyles.page}>
        <View style={contractStyles.header}>
          <View style={contractStyles.headerTop}>
            <View style={contractStyles.headerTitleCol}>
              <Text style={contractStyles.kicker}>{agreementLabel}</Text>
              <Text style={contractStyles.h1}>{contract.title}</Text>
            </View>
            <Image src="/keda-white.png" style={contractStyles.logo} />
          </View>
          <View style={contractStyles.refRow}>
            <View style={contractStyles.refItem}>
              <Text style={contractStyles.refLabel}>Ref</Text>
              <Text style={contractStyles.refValue}>{ref || '—'}</Text>
            </View>
            <View style={contractStyles.refItem}>
              <Text style={contractStyles.refLabel}>Issued</Text>
              <Text style={contractStyles.refValue}>{issued}</Text>
            </View>
          </View>
        </View>

        <View style={contractStyles.body}>
          <Text style={[contractStyles.sectionHead, contractStyles.sectionHeadFirst]}>Parties</Text>
          <View style={contractStyles.partiesGrid}>
            <View style={contractStyles.partyCell}>
              <Text style={contractStyles.partyLabel}>The Studio</Text>
              <Text style={contractStyles.partyName}>{STUDIO_NAME}</Text>
              <Text style={contractStyles.partyMeta}>Cairo, Egypt</Text>
            </View>
            <View style={contractStyles.partyCell}>
              <Text style={contractStyles.partyLabel}>The {partyLabel}</Text>
              <Text style={contractStyles.partyName}>{contract.partyName || '—'}</Text>
              {contract.role ? <Text style={contractStyles.partyMeta}>{contract.role}</Text> : null}
            </View>
          </View>

          <Text style={contractStyles.preamble}>{preamble}</Text>

          {(contract.items || []).length > 0 ? (
            <>
              <Text style={contractStyles.sectionHead}>{scopeHeadLabel}</Text>
              <View style={contractStyles.scopeHeadRow}>
                <Text style={contractStyles.scopeHeadLabel}>Item</Text>
                <Text style={contractStyles.scopeHeadQty}>Qty</Text>
                {hasAmounts ? <Text style={contractStyles.scopeHeadAmt}>Amount</Text> : null}
              </View>
              {contract.items.map((it, i) => (
                <View style={contractStyles.scopeRow} key={i} wrap={false}>
                  <Text style={contractStyles.scopeLabel}>{it.label}</Text>
                  <Text style={contractStyles.scopeQty}>{it.quantity || '—'}</Text>
                  {hasAmounts ? (
                    <Text style={contractStyles.scopeAmt}>{it.amount ? `${it.amount} ${currency}` : ''}</Text>
                  ) : null}
                </View>
              ))}
              {hasAmounts && total > 0 ? (
                <View style={contractStyles.totalRow}>
                  <Text style={contractStyles.totalLabel}>{totalLabel}</Text>
                  <Text style={contractStyles.totalValue}>{formatAmount(total)} {currency}</Text>
                </View>
              ) : null}
            </>
          ) : null}

          {termsClauses.length > 0 ? (
            <>
              <Text style={contractStyles.sectionHead}>Terms &amp; Conditions</Text>
              {termsClauses.map((p, i) => (
                <View style={contractStyles.clauseRow} key={i} wrap={false}>
                  <Text style={contractStyles.clauseNum}>{i + 1}.</Text>
                  <Text style={contractStyles.clauseText}>{p}</Text>
                </View>
              ))}
            </>
          ) : null}

          {noteParas.length > 0 ? (
            <>
              <Text style={contractStyles.sectionHead}>Notes</Text>
              {noteParas.map((p, i) => <Text style={contractStyles.para} key={i}>{p}</Text>)}
            </>
          ) : null}

          <View style={contractStyles.signRow} wrap={false}>
            <View style={contractStyles.signCell}>
              <View style={contractStyles.signSpace} />
              <View style={contractStyles.signLine}>
                <Text style={contractStyles.signName}>KEDA</Text>
                <Text style={contractStyles.signRole}>The Studio · Signature &amp; date</Text>
              </View>
            </View>
            <View style={contractStyles.signCell}>
              <View style={contractStyles.signSpace} />
              <View style={contractStyles.signLine}>
                <Text style={contractStyles.signName}>{contract.partyName || ' '}</Text>
                <Text style={contractStyles.signRole}>The {partyLabel} · Signature &amp; date</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={contractStyles.footer} fixed>{STUDIO_NAME} · Cairo, Egypt</Text>
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
