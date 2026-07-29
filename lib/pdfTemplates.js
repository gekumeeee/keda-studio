'use client';

// PDF document definitions for the admin's Invoices and Pricing tabs.
// Kept in its own module so admin/page.js can `import()` it lazily on click
// instead of bundling @react-pdf/renderer (a heavy library) into the initial
// admin page load.

import { Document, Page, View, Text, Image, Font, StyleSheet, pdf } from '@react-pdf/renderer';
import { formatAmount, invoiceTotals } from '@/lib/invoiceMath';

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

const pricingStyles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Bricolage Grotesque', fontSize: 11, color: INK },
  h1: { fontSize: 38, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 },
  intro: { fontSize: 12, color: DIM, marginTop: 14, lineHeight: 1.5, maxWidth: 420 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: 8 },
  headLeft: { fontSize: 12, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 },
  headRight: { fontSize: 12, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 0.5, width: 110, textAlign: 'right' },
  row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: LINE, alignItems: 'flex-start' },
  rowLeft: { flex: 1, paddingRight: 20 },
  name: { fontSize: 13, fontWeight: 700 },
  note: { fontSize: 10.5, color: DIM, marginTop: 4, lineHeight: 1.4 },
  price: { width: 110, textAlign: 'right', fontSize: 13, fontWeight: 700 },
  logo: { position: 'absolute', bottom: 44, right: 48, width: 90, height: 'auto' },
});

function PricingDocument({ pricing }) {
  const currency = pricing.currency || 'LE';
  return (
    <Document>
      <Page size="A4" style={pricingStyles.page}>
        <Text style={pricingStyles.h1}>{pricing.heading || 'Our Services & Pricing'}</Text>
        {pricing.intro ? <Text style={pricingStyles.intro}>{pricing.intro}</Text> : null}

        <View style={pricingStyles.headRow}>
          <Text style={pricingStyles.headLeft}>Service</Text>
          <Text style={pricingStyles.headRight}>Price</Text>
        </View>

        {(pricing.services || []).map((s, i) => (
          <View style={pricingStyles.row} key={i}>
            <View style={pricingStyles.rowLeft}>
              <Text style={pricingStyles.name}>{s.name}</Text>
              {s.note ? <Text style={pricingStyles.note}>{s.note}</Text> : null}
            </View>
            <Text style={pricingStyles.price}>{s.price ? `${s.price} ${currency}` : ''}</Text>
          </View>
        ))}

        <Image src="/keda-black.png" style={pricingStyles.logo} />
      </Page>
    </Document>
  );
}

export async function downloadInvoicePdf(invoice) {
  registerFonts();
  const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
  triggerDownload(blob, `${(invoice.projectName || 'invoice').replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}

export async function downloadPricingPdf(pricing) {
  registerFonts();
  const blob = await pdf(<PricingDocument pricing={pricing} />).toBlob();
  triggerDownload(blob, 'keda-services-pricing.pdf');
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
