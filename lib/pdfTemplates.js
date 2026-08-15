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

// Font family used everywhere below. This MUST be a single font name, not a
// fallback array like ['Bricolage Grotesque', 'Cairo'] — react-pdf's
// fontSubstitution engine (which walks a fallback array per code point) puts
// each run through a separate font, and that interacts badly with its bidi
// reordering: any Arabic paragraph that wraps onto more than one line comes
// out with scrambled word order (letters/words shape correctly in isolation,
// but the sequence on the page doesn't match the logical text — confirmed
// via isolated repro, and a known upstream bug: diegomura/react-pdf#3406).
// A single font has no substitution step, so bidi reordering runs cleanly —
// confirmed correct for Arabic, English, and mixed-language paragraphs, both
// single-line and wrapped. Cairo alone also fully covers Latin letters,
// digits and punctuation, so it's safe to use for every field, including
// pure-English ones, at the cost of losing the Bricolage Grotesque brand
// face on body text (still used for nothing here — see registerFonts below,
// kept registered only in case a future static/never-free-text label wants
// it explicitly).
//
// WARNING when replacing /public/fonts/Cairo-*.ttf: Google Fonts serves a
// LATIN-ONLY subset by default. A Cairo file without `&subset=arabic` looks
// like a valid font (right name, GSUB/GPOS tables present) but its cmap has
// zero Arabic code points, so Arabic glyphs silently come out broken. The
// files here are the arabic subset (~72KB each, 102 Arabic code points); a
// ~33KB Cairo file is the latin-only one.
const TEXT_FONT = 'Cairo';

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
  Font.register({
    family: 'Cairo',
    fonts: [
      { src: '/fonts/Cairo-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/Cairo-SemiBold.ttf', fontWeight: 600 },
      { src: '/fonts/Cairo-Bold.ttf', fontWeight: 700 },
      { src: '/fonts/Cairo-ExtraBold.ttf', fontWeight: 800 },
    ],
  });
  fontsRegistered = true;
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: TEXT_FONT, fontSize: 11, color: INK },
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
  page: { padding: 48, fontFamily: TEXT_FONT, fontSize: 11, color: INK },
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

// A Proposal reuses a Plan as its data source (no separate store/type) — same
// layout as PlanDocument, plus an optional "Prepared for" line so it reads as
// personalized to a specific prospect rather than a generic rate card.
const proposalStyles = planStyles;

function ProposalDocument({ plan, clientName }) {
  const currency = plan.currency || 'LE';
  return (
    <Document>
      <Page size="A4" style={proposalStyles.page}>
        <Text style={proposalStyles.kicker}>Proposal</Text>
        <Text style={proposalStyles.h1}>{plan.name}</Text>
        {clientName?.trim() ? (
          <Text style={proposalStyles.description}>Prepared for {clientName.trim()}</Text>
        ) : null}
        {plan.description ? <Text style={proposalStyles.description}>{plan.description}</Text> : null}

        {plan.price ? (
          <View style={proposalStyles.priceBlock}>
            <Text style={proposalStyles.priceLabel}>Price</Text>
            <Text style={proposalStyles.priceValue}>
              {plan.price} {currency}
              {plan.cycle ? <Text style={proposalStyles.priceCycle}> / {plan.cycle}</Text> : null}
            </Text>
          </View>
        ) : null}

        {plan.items && plan.items.length > 0 ? (
          <>
            <Text style={proposalStyles.includedHead}>What&apos;s included</Text>
            {plan.items.map((it, i) => (
              <Text style={proposalStyles.bullet} key={i}>
                <Text style={proposalStyles.bulletMark}>—  </Text>
                {it}
              </Text>
            ))}
          </>
        ) : null}

        <Image src="/keda-black.png" style={proposalStyles.logo} />
      </Page>
    </Document>
  );
}

const STUDIO_NAME = 'KEDA — Brand & Creative Agency';

// Contracts render differently depending on partyType: a client agreement
// frames things as services/deliverables sold, a team agreement frames them
// as a role and its responsibilities. Same data shape either way — only the
// section labels and preamble wording change.
// A contract must always come out as a single page — a two-page agreement
// where page 2 holds nothing but signatures looks unfinished. react-pdf has
// no auto-shrink, so instead every dimension below is expressed as a multiple
// of a scale `s`, and buildContractLayout() (further down) estimates the
// rendered height and picks the largest `s` that still fits on one A4 sheet.
// Two independent scales: `t` sizes the type, `g` sizes the gaps (padding,
// margins, blank signing space). Whitespace is squeezed first and much
// harder than type, so a long contract stays readable instead of turning
// into 5pt text — see pickContractScale().
//
// Terms/notes are set smaller than the body above them (scope items, parties):
// they're the fine print, and a long clause list reads better dense than it
// does competing with the deal terms for weight. Shared with
// estimateContractHeight() so the two can't drift out of sync.
const CLAUSE_SIZE = 8.5;
const CLAUSE_NUM_WIDTH = 18;
function makeContractStyles(t, g) {
  const ft = (n) => n * t;
  const gp = (n) => n * g;
  return StyleSheet.create({
    page: { padding: 0, fontFamily: TEXT_FONT, fontSize: ft(11), color: INK },

    // dark branded band across the top (page padding is 0 so it's full-bleed)
    header: { backgroundColor: ACCENT, paddingHorizontal: 48, paddingTop: gp(34), paddingBottom: gp(28) },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerTitleCol: { flex: 1, paddingRight: 16 },
    kicker: { fontSize: ft(10), fontWeight: 700, color: '#AEB7C0', textTransform: 'uppercase', letterSpacing: 2 },
    h1: { fontSize: ft(26), fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.4, marginTop: gp(8), lineHeight: 1.1 },
    logo: { width: ft(64), height: 'auto' },
    refRow: { flexDirection: 'row', marginTop: gp(20), gap: 26 },
    refItem: { flexDirection: 'row' },
    refLabel: { fontSize: ft(8.5), fontWeight: 700, color: '#8791A0', textTransform: 'uppercase', letterSpacing: 1 },
    refValue: { fontSize: ft(8.5), fontWeight: 700, color: '#E4E8EC', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 6 },

    // paddingBottom stays small: the fixed footer already reserves visual space,
    // and any extra here overflows into a stray blank page once content is long.
    body: { paddingHorizontal: 48, paddingTop: gp(24), paddingBottom: gp(16) },

    sectionHead: { fontSize: ft(11), fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.4, marginTop: gp(20), marginBottom: gp(10), borderBottomWidth: 1, borderBottomColor: LINE, paddingBottom: gp(7) },
    sectionHeadFirst: { marginTop: gp(4) },

    partiesGrid: { flexDirection: 'row', gap: 24 },
    partyCell: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: gp(14) },
    partyLabel: { fontSize: ft(8.5), fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 1 },
    partyName: { fontSize: ft(13), fontWeight: 700, color: INK, marginTop: gp(5), lineHeight: 1.25 },
    partyMeta: { fontSize: ft(10), color: DIM, marginTop: gp(3) },

    preamble: { fontSize: ft(11), color: INK, lineHeight: 1.55, marginTop: gp(14) },

    scopeHeadRow: { flexDirection: 'row', marginBottom: gp(6) },
    scopeHeadLabel: { flex: 1, fontSize: ft(8.5), fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6 },
    scopeHeadQty: { width: ft(90), fontSize: ft(8.5), fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
    scopeHeadAmt: { width: ft(96), fontSize: ft(8.5), fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right' },
    scopeRow: { flexDirection: 'row', paddingVertical: gp(9), borderBottomWidth: 1, borderBottomColor: LINE, alignItems: 'center' },
    scopeLabel: { flex: 1, fontSize: ft(12), fontWeight: 700, color: INK, paddingRight: 12 },
    scopeQty: { width: ft(90), fontSize: ft(11), color: INK, textAlign: 'center' },
    scopeAmt: { width: ft(96), fontSize: ft(12), fontWeight: 700, color: INK, textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: gp(14), paddingTop: gp(12), borderTopWidth: 2, borderTopColor: ACCENT },
    totalLabel: { fontSize: ft(11), fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1 },
    totalValue: { fontSize: ft(22), fontWeight: 800, color: INK },

    clauseRow: { flexDirection: 'row', marginBottom: gp(7) },
    clauseNum: { width: ft(CLAUSE_NUM_WIDTH), fontSize: ft(CLAUSE_SIZE), fontWeight: 800, color: ACCENT },
    clauseText: { flex: 1, fontSize: ft(CLAUSE_SIZE), color: INK, lineHeight: 1.5 },
    para: { fontSize: ft(CLAUSE_SIZE), color: INK, lineHeight: 1.5, marginBottom: gp(7) },

    signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: gp(28) },
    signCell: { width: '44%' },
    signSpace: { height: gp(34) },
    signLine: { borderTopWidth: 1, borderTopColor: INK, paddingTop: gp(6) },
    signName: { fontSize: ft(11), fontWeight: 700, color: INK },
    signRole: { fontSize: ft(8.5), color: DIM, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: gp(2) },

    footer: { position: 'absolute', bottom: 22, left: 48, right: 48, textAlign: 'center', fontSize: 8, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: 1.4 },
  });
}

const A4_HEIGHT = 841.89;
const CONTENT_WIDTH = 595.28 - 96; // A4 width minus the 48pt side padding
const FOOTER_CLEARANCE = 34; // room reserved for the fixed footer strip

// Rough text metrics: Bricolage Grotesque averages a little over half its
// point size per character, which is close enough to predict line counts.
function lineCount(text, fontSize, width) {
  if (!text) return 0;
  const perLine = Math.max(1, Math.floor(width / (fontSize * 0.52)));
  return Math.max(1, Math.ceil(text.length / perLine));
}

// Estimate how tall the whole contract renders at a given scale. Mirrors the
// structure of ContractDocument below — if that layout changes materially,
// this needs the matching tweak or the one-page guarantee drifts.
function estimateContractHeight(c, t, g) {
  const ft = (n) => n * t;
  const gp = (n) => n * g;
  const halfCell = (CONTENT_WIDTH - 24) / 2 - gp(28);
  let h = 0;

  // header band
  h += gp(34) + ft(10) * 1.2 + gp(8);
  h += lineCount(c.title, ft(26), CONTENT_WIDTH - ft(64) - 16) * ft(26) * 1.1;
  h += gp(20) + ft(8.5) * 1.2 + gp(28);

  // body
  h += gp(24);
  h += gp(4) + ft(11) * 1.2 + gp(7) + gp(10); // "Parties" head
  const partyLines = Math.max(
    lineCount(STUDIO_NAME, ft(13), halfCell),
    lineCount(c.partyName || '-', ft(13), halfCell),
  );
  h += gp(28) + ft(8.5) * 1.2 + gp(5) + partyLines * ft(13) * 1.25 + gp(3) + ft(10) * 1.2 + 2;
  h += gp(14) + lineCount(c._preamble, ft(11), CONTENT_WIDTH) * ft(11) * 1.55;

  const items = c.items || [];
  if (items.length) {
    h += gp(20) + ft(11) * 1.2 + gp(7) + gp(10); // scope head
    h += ft(8.5) * 1.2 + gp(6); // column labels
    const labelWidth = CONTENT_WIDTH - ft(90) - ft(96) - 12;
    for (const it of items) {
      h += gp(18) + lineCount(it.label, ft(12), labelWidth) * ft(12) * 1.2 + 1;
    }
    if (items.some((it) => it.amount && it.amount.trim())) {
      h += gp(14) + gp(12) + 2 + ft(22) * 1.2; // total row
    }
  }

  const clauses = c._clauses || [];
  if (clauses.length) {
    h += gp(20) + ft(11) * 1.2 + gp(7) + gp(10);
    for (const t2 of clauses) {
      h += lineCount(t2, ft(CLAUSE_SIZE), CONTENT_WIDTH - ft(CLAUSE_NUM_WIDTH)) * ft(CLAUSE_SIZE) * 1.5 + gp(7);
    }
  }

  const notes = c._notes || [];
  if (notes.length) {
    h += gp(20) + ft(11) * 1.2 + gp(7) + gp(10);
    for (const n of notes) {
      h += lineCount(n, ft(CLAUSE_SIZE), CONTENT_WIDTH) * ft(CLAUSE_SIZE) * 1.5 + gp(7);
    }
  }

  // signature block
  h += gp(28) + gp(34) + 1 + gp(6) + ft(11) * 1.2 + gp(2) + ft(8.5) * 1.2;
  h += gp(16); // body paddingBottom
  return h;
}

// Returns [typeScale, gapScale] — the roomiest pair that still fits one page.
// Whitespace is given up first (down to 45%) because tightening a layout reads
// as "dense"; shrinking type reads as "unreadable". Only once the gaps are
// fully compressed does the type start scaling, and never below 70%.
function pickContractScale(c) {
  const budget = A4_HEIGHT - FOOTER_CLEARANCE;
  const MIN_GAP = 0.42;
  const MIN_TYPE = 0.5;

  for (let g = 1; g >= MIN_GAP; g -= 0.05) {
    if (estimateContractHeight(c, 1, g) <= budget) return [1, g];
  }
  for (let t = 1; t >= MIN_TYPE; t -= 0.02) {
    if (estimateContractHeight(c, t, MIN_GAP) <= budget) return [t, MIN_GAP];
  }
  return [MIN_TYPE, MIN_GAP];
}

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

  // Shrink the document just enough to keep it on one page.
  const [typeScale, gapScale] = pickContractScale({
    ...contract, _preamble: preamble, _clauses: termsClauses, _notes: noteParas,
  });
  const contractStyles = makeContractStyles(typeScale, gapScale);

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
              <Text style={contractStyles.partyLabel}>The Agency</Text>
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
                <Text style={contractStyles.signRole}>The Agency · Signature &amp; date</Text>
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

export async function downloadProposalPdf(plan, clientName) {
  registerFonts();
  const blob = await pdf(<ProposalDocument plan={plan} clientName={clientName} />).toBlob();
  const base = (clientName?.trim() || plan.name || 'proposal').replace(/[^a-z0-9]+/gi, '-');
  triggerDownload(blob, `proposal-${base}.pdf`);
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
