import { formatAmount, invoiceTotals, contractTotal } from '@/lib/invoiceMath';

// The admin's documents as ordinary HTML, one A4 sheet each. lib/pdfTemplates.js
// renders one off-screen, lets the browser lay it out, and turns that into the
// PDF — so Arabic is shaped and ordered by the browser itself, the same way
// the website shows it. Every field that holds typed content carries
// dir="auto" (or sits in a <bdi>), so an Arabic line reads right to left and
// right-aligned while the English labels around it stay put.

// A4 at 96 CSS px per inch.
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

const INK = '#171A1D';
const DIM = '#6B7580';
const ACCENT = '#2F3A44';
const LINE = '#D9D6D5';

export const STUDIO_NAME = 'KEDA — Brand & Creative Agency';

export const SHEET_CSS = `
.pdf-page{position:relative; width:${PAGE_WIDTH}px; height:${PAGE_HEIGHT}px; overflow:hidden; background:#fff;
  color:${INK}; font-family:'KedaPdfCairo', sans-serif; font-size:14px; line-height:1.45;
  -webkit-font-smoothing:antialiased; direction:ltr; text-align:start;}
.pdf-page *{box-sizing:border-box; margin:0; padding:0;}
.pdf-fit{position:absolute; top:0; left:0; transform-origin:0 0;}
.pdf-display{font-family:'KedaPdfBricolage', 'KedaPdfCairo', sans-serif;}
.pdf-logo{position:absolute; right:64px; bottom:58px; width:120px; height:auto;}
.pdf-rtl-safe{unicode-bidi:plaintext;}

/* ---- invoice ---- */
.inv{padding:64px 64px 0;}
.inv h1{font-size:61px; font-weight:800; color:${ACCENT}; letter-spacing:-1.5px; line-height:1;}
.inv-meta{font-size:16px; margin-top:18px;}
.inv-meta b{font-weight:700;}
.inv-head{display:flex; justify-content:space-between; margin:46px 0 18px; font-size:20px; font-weight:800; color:${ACCENT};}
.inv-row{display:flex; margin-bottom:26px;}
.inv-item{flex:1; padding-right:26px; border-right:1px solid ${LINE};}
.inv-item-title{font-size:17px; font-weight:700;}
.inv-item ul{margin-top:6px; padding-inline-start:18px;}
.inv-item li{font-size:14px; margin-top:4px;}
.inv-price{width:150px; text-align:right; font-size:17px; font-weight:700;}
.inv-hr{border-top:1px solid ${LINE}; margin:8px 0 28px;}
.inv-total{margin-bottom:18px;}
.inv-total-label{font-size:14px; font-weight:700; color:${ACCENT}; text-transform:uppercase; letter-spacing:.6px;}
.inv-total-value{font-size:22px; font-weight:700; margin-top:2px;}
.inv-total-value.is-big{font-size:27px; font-weight:800;}

/* ---- plan / proposal ---- */
.plan{padding:64px 64px 0;}
.plan-kicker{font-size:14px; font-weight:700; color:${ACCENT}; text-transform:uppercase; letter-spacing:1.8px;}
.plan h1{font-size:53px; font-weight:800; color:${ACCENT}; letter-spacing:-.6px; margin-top:10px; line-height:1.08;}
/* capped width, anchored to the side it reads from (right, for Arabic) */
.plan-desc{font-size:17px; color:${DIM}; margin-top:18px; line-height:1.55; max-width:620px; margin-inline-end:auto;}
.plan-price{margin-top:42px; padding:34px 0; border-top:1px solid ${LINE}; border-bottom:1px solid ${LINE};
  display:flex; align-items:baseline; justify-content:space-between; gap:20px;}
.plan-price-label{font-size:14px; font-weight:700; color:${ACCENT}; text-transform:uppercase; letter-spacing:1.6px;}
.plan-price-value{font-size:45px; font-weight:800;}
.plan-price-cycle{font-size:17px; font-weight:400; color:${DIM}; margin-left:6px;}
.plan-included{font-size:16px; font-weight:700; color:${ACCENT}; text-transform:uppercase; letter-spacing:1.6px; margin:42px 0 16px;}
.plan-list{list-style:none;}
.plan-list li{font-size:16px; margin-bottom:10px; line-height:1.45; display:flex; gap:12px;}
.plan-list li::before{content:'—'; color:${ACCENT}; font-weight:700; flex:none;}

/* ---- contract ---- */
.con-header{background:${ACCENT}; color:#fff; padding:45px 64px 37px;}
.con-header-top{display:flex; justify-content:space-between; align-items:flex-start; gap:20px;}
.con-kicker{font-size:13px; font-weight:700; color:#AEB7C0; text-transform:uppercase; letter-spacing:2.6px;}
.con-header h1{font-size:35px; font-weight:800; color:#fff; letter-spacing:-.5px; margin-top:10px; line-height:1.12;}
.con-logo{width:86px; height:auto; flex:none;}
.con-ref{display:flex; gap:34px; margin-top:26px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.3px;}
.con-ref span{color:#8791A0;}
.con-ref b{color:#E4E8EC; margin-left:8px;}
.con-body{padding:32px 64px 20px;}
.con-section{font-size:15px; font-weight:800; color:${ACCENT}; text-transform:uppercase; letter-spacing:1.8px;
  margin:26px 0 13px; padding-bottom:9px; border-bottom:1px solid ${LINE};}
.con-section.is-first{margin-top:4px;}
.con-parties{display:flex; gap:32px;}
.con-party{flex:1; border:1px solid ${LINE}; border-radius:8px; padding:18px;}
.con-party-label{font-size:11px; font-weight:700; color:${DIM}; text-transform:uppercase; letter-spacing:1.3px;}
.con-party-name{font-size:17px; font-weight:700; margin-top:6px; line-height:1.3;}
.con-party-meta{font-size:13px; color:${DIM}; margin-top:4px;}
.con-preamble{font-size:15px; line-height:1.6; margin-top:18px;}
.con-scope-head{display:flex; margin-bottom:8px; font-size:11px; font-weight:700; color:${DIM}; text-transform:uppercase; letter-spacing:.8px;}
.con-scope-row{display:flex; align-items:center; padding:12px 0; border-bottom:1px solid ${LINE};}
.con-col-label{flex:1; padding-right:16px;}
.con-col-qty{width:120px; text-align:center;}
.con-col-amt{width:128px; text-align:right;}
.con-scope-row .con-col-label{font-size:16px; font-weight:700;}
.con-scope-row .con-col-qty{font-size:15px;}
.con-scope-row .con-col-amt{font-size:16px; font-weight:700;}
.con-total{display:flex; justify-content:space-between; align-items:baseline; margin-top:18px; padding-top:16px; border-top:2px solid ${ACCENT};}
.con-total-label{font-size:15px; font-weight:800; color:${ACCENT}; text-transform:uppercase; letter-spacing:1.3px;}
.con-total-value{font-size:29px; font-weight:800;}
.con-clause{display:flex; gap:10px; margin-bottom:9px; font-size:12px; line-height:1.55;}
.con-clause-num{flex:none; min-width:18px; font-weight:800; color:${ACCENT};}
.con-note{font-size:12px; line-height:1.55; margin-bottom:9px;}
.con-sign{display:flex; justify-content:space-between; margin-top:38px;}
.con-sign-cell{width:44%;}
.con-sign-space{height:46px;}
.con-sign-line{border-top:1px solid ${INK}; padding-top:8px;}
.con-sign-name{font-size:15px; font-weight:700;}
.con-sign-role{font-size:11px; color:${DIM}; text-transform:uppercase; letter-spacing:1px; margin-top:2px;}
.con-footer{position:absolute; left:64px; right:64px; bottom:26px; text-align:center; font-size:10px; font-weight:700;
  color:${DIM}; text-transform:uppercase; letter-spacing:1.8px;}
`;

// Content blocks that may be Arabic: direction follows the text itself.
function Auto({ as: Tag = 'div', className, children }) {
  return <Tag className={className} dir="auto">{children}</Tag>;
}

function money(value, currency) {
  return <bdi>{value} {currency}</bdi>;
}

export function InvoiceSheet({ invoice }) {
  const { subtotal, discount, total } = invoiceTotals(invoice);
  const currency = invoice.currency || 'LE';
  return (
    <div className="inv">
      <h1 className="pdf-display">INVOICE</h1>
      <div className="inv-meta"><b>Project: </b><bdi>{invoice.projectName}</bdi></div>
      {invoice.clientName ? <div className="inv-meta"><b>Client: </b><bdi>{invoice.clientName}</bdi></div> : null}

      <div className="inv-head"><span>Project Deliverables</span><span>Price</span></div>
      {(invoice.sections || []).map((s, i) => (
        <div className="inv-row" key={i}>
          <div className="inv-item">
            <Auto className="inv-item-title">{s.title}</Auto>
            {(s.items || []).filter((it) => String(it).trim()).length ? (
              <ul dir="auto">
                {s.items.filter((it) => String(it).trim()).map((it, j) => <li key={j} dir="auto">{it}</li>)}
              </ul>
            ) : null}
          </div>
          <div className="inv-price">{s.price ? money(s.price, currency) : ''}</div>
        </div>
      ))}

      <div className="inv-hr" />
      <div className="inv-total">
        <div className="inv-total-label">Subtotal</div>
        <div className="inv-total-value">{money(formatAmount(subtotal), currency)}</div>
      </div>
      {discount > 0 ? (
        <div className="inv-total">
          <div className="inv-total-label">Discount</div>
          <div className="inv-total-value">{money(formatAmount(discount), currency)}</div>
        </div>
      ) : null}
      <div className="inv-total">
        <div className="inv-total-label">Total Amount</div>
        <div className="inv-total-value is-big">{money(formatAmount(total), currency)}</div>
      </div>
    </div>
  );
}

// A proposal is a plan with a "Prepared for" line, so one sheet serves both.
export function PlanSheet({ plan, kicker = 'Plan', clientName = '' }) {
  const currency = plan.currency || 'LE';
  const items = (plan.items || []).filter((it) => String(it).trim());
  return (
    <div className="plan">
      <div className="plan-kicker">{kicker}</div>
      <Auto as="h1" className="pdf-display">{plan.name}</Auto>
      {clientName.trim() ? <div className="plan-desc">Prepared for <bdi>{clientName.trim()}</bdi></div> : null}
      {plan.description ? <Auto className="plan-desc">{plan.description}</Auto> : null}
      {plan.price ? (
        <div className="plan-price">
          <div className="plan-price-label">Price</div>
          <div className="plan-price-value">
            {money(plan.price, currency)}
            {plan.cycle ? <span className="plan-price-cycle">/ <bdi>{plan.cycle}</bdi></span> : null}
          </div>
        </div>
      ) : null}
      {items.length ? (
        <>
          <div className="plan-included">What&apos;s included</div>
          <ul className="plan-list">
            {items.map((it, i) => <li key={i} dir="auto">{it}</li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ContractSheet({ contract }) {
  const isTeam = contract.partyType === 'employee';
  const currency = contract.currency || 'LE';
  const total = contractTotal(contract);
  const items = contract.items || [];
  const hasAmounts = items.some((it) => it.amount && String(it.amount).trim());
  const partyLabel = isTeam ? 'Team Member' : 'Client';
  const clauses = (contract.terms || '').split('\n').filter((l) => l.trim());
  const notes = (contract.notes || '').split('\n').filter((l) => l.trim());
  const ref = (contract.id || '').slice(-6).toUpperCase();
  const issued = fmtDate(contract.updated) || fmtDate(new Date().toISOString());
  const period = [
    contract.startDate ? `effective ${fmtDate(contract.startDate)}` : '',
    contract.endDate ? `until ${fmtDate(contract.endDate)}` : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className="con-header">
        <div className="con-header-top">
          <div>
            <div className="con-kicker">{isTeam ? 'Team Agreement' : 'Client Agreement'}</div>
            <Auto as="h1" className="pdf-display">{contract.title}</Auto>
          </div>
          <img className="con-logo" src="/keda-white.png" alt="" />
        </div>
        <div className="con-ref">
          <div><span>Ref</span><b>{ref || '—'}</b></div>
          <div><span>Issued</span><b>{issued}</b></div>
        </div>
      </div>

      <div className="con-body">
        <div className="con-section is-first">Parties</div>
        <div className="con-parties">
          <div className="con-party">
            <div className="con-party-label">The Agency</div>
            <div className="con-party-name">{STUDIO_NAME}</div>
            <div className="con-party-meta">Cairo, Egypt</div>
          </div>
          <div className="con-party">
            <div className="con-party-label">The {partyLabel}</div>
            <Auto className="con-party-name">{contract.partyName || '—'}</Auto>
            {contract.role ? <Auto className="con-party-meta">{contract.role}</Auto> : null}
          </div>
        </div>

        <p className="con-preamble">
          {isTeam ? (
            <>This agreement sets out the working arrangement between {STUDIO_NAME} and <bdi>{contract.partyName || 'the Team Member'}</bdi>{contract.role ? <> as <bdi>{contract.role}</bdi></> : null}{period ? `, ${period}` : ''}.</>
          ) : (
            <>This agreement sets out the services {STUDIO_NAME} will provide to <bdi>{contract.partyName || 'the Client'}</bdi>{period ? `, ${period}` : ''}.</>
          )}
        </p>

        {items.length ? (
          <>
            <div className="con-section">{isTeam ? 'Role & Responsibilities' : 'Scope of Work & Deliverables'}</div>
            <div className="con-scope-head">
              <div className="con-col-label">Item</div>
              <div className="con-col-qty">Qty</div>
              {hasAmounts ? <div className="con-col-amt">Amount</div> : null}
            </div>
            {items.map((it, i) => (
              <div className="con-scope-row" key={i}>
                <Auto className="con-col-label">{it.label}</Auto>
                <div className="con-col-qty"><bdi>{it.quantity || '—'}</bdi></div>
                {hasAmounts ? <div className="con-col-amt">{it.amount ? money(it.amount, currency) : ''}</div> : null}
              </div>
            ))}
            {hasAmounts && total > 0 ? (
              <div className="con-total">
                <div className="con-total-label">{isTeam ? 'Compensation' : 'Total Investment'}</div>
                <div className="con-total-value">{money(formatAmount(total), currency)}</div>
              </div>
            ) : null}
          </>
        ) : null}

        {clauses.length ? (
          <>
            <div className="con-section">Terms &amp; Conditions</div>
            {clauses.map((c, i) => (
              <div className="con-clause" key={i} dir="auto">
                <span className="con-clause-num">{i + 1}.</span>
                <span>{c}</span>
              </div>
            ))}
          </>
        ) : null}

        {notes.length ? (
          <>
            <div className="con-section">Notes</div>
            {notes.map((n, i) => <Auto as="p" className="con-note" key={i}>{n}</Auto>)}
          </>
        ) : null}

        <div className="con-sign">
          <div className="con-sign-cell">
            <div className="con-sign-space" />
            <div className="con-sign-line">
              <div className="con-sign-name">KEDA</div>
              <div className="con-sign-role">The Agency · Signature &amp; date</div>
            </div>
          </div>
          <div className="con-sign-cell">
            <div className="con-sign-space" />
            <div className="con-sign-line">
              <Auto className="con-sign-name">{contract.partyName || ' '}</Auto>
              <div className="con-sign-role">The {partyLabel} · Signature &amp; date</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
