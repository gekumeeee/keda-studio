'use client';

// PDF downloads for the admin's Invoices, Plans (and proposals) and Contracts.
// Loaded with import() on click, so none of this is in the admin's first load.
//
// How: the document is rendered as ordinary HTML (components/admin/PdfSheets.js)
// in an off-screen A4-sized box, the browser lays it out, and that box is
// captured as a high-resolution image and placed on a single A4 PDF page
// (lib/jpegPdf.js).
//
// Why not a PDF layout library: this used @react-pdf/renderer, and its bidi
// step crashes on real Arabic — any wrapped line containing the لا ligature,
// any wrapped mixed Arabic/English line, and even one short line with
// tanween or Arabic-Indic digits ("٢٠ تصميم شهريًا") threw inside the
// library, so the download silently did nothing. The browser's own text
// engine has none of those problems. It also makes "always one page" exact:
// the laid-out height is measured, and the sheet is scaled down until it
// fits, instead of estimated from character counts.

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toJpeg } from 'html-to-image';
import { jpegToPdf } from '@/lib/jpegPdf';
import {
  SHEET_CSS, PAGE_WIDTH, PAGE_HEIGHT, STUDIO_NAME,
  InvoiceSheet, PlanSheet, ContractSheet,
} from '@/components/admin/PdfSheets';

// The same TTFs the site serves from /public/fonts: Cairo carries Arabic and
// Latin; Bricolage is the brand display face for the big Latin headings.
// Registered under their own names so they can't collide with the site's
// Google-hosted Cairo.
const FONT_FILES = [
  ['KedaPdfCairo', 400, '/fonts/Cairo-Regular.ttf'],
  ['KedaPdfCairo', 600, '/fonts/Cairo-SemiBold.ttf'],
  ['KedaPdfCairo', 700, '/fonts/Cairo-Bold.ttf'],
  ['KedaPdfCairo', 800, '/fonts/Cairo-ExtraBold.ttf'],
  ['KedaPdfBricolage', 400, '/fonts/BricolageGrotesque-Regular.ttf'],
  ['KedaPdfBricolage', 700, '/fonts/BricolageGrotesque-Bold.ttf'],
  ['KedaPdfBricolage', 800, '/fonts/BricolageGrotesque-ExtraBold.ttf'],
];
const fontFace = (family, weight, src) =>
  `@font-face{font-family:'${family}';src:url('${src}') format('truetype');font-weight:${weight};font-style:normal;}`;
const FONT_CSS = FONT_FILES.map(([f, w, src]) => fontFace(f, w, src)).join('\n');

// The capture happens inside an SVG image, which can't fetch fonts on its
// own — they go in as data: URLs. Built once per admin session.
let embeddedFonts = null;
function embeddedFontCss() {
  if (!embeddedFonts) {
    embeddedFonts = Promise.all(
      FONT_FILES.map(async ([f, w, src]) => {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`font ${src} failed to load`);
        return fontFace(f, w, `data:font/ttf;base64,${toBase64(await res.arrayBuffer())}`);
      })
    ).then((parts) => parts.join('\n'));
    embeddedFonts.catch(() => {
      embeddedFonts = null; // let the next download try again
    });
  }
  return embeddedFonts;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// Scale the sheet down, if it has to, until it fits the room left on the
// page. Width is widened by the same factor first, so after scaling it still
// spans the full page — lines re-wrap longer rather than the page going
// narrow. Never below 55%: past that it stops being readable anyway.
function fitToPage(el, available) {
  for (let z = 1; z >= 0.55; z -= 0.01) {
    el.style.width = `${PAGE_WIDTH / z}px`;
    el.style.transform = `scale(${z})`;
    if (el.getBoundingClientRect().height <= available) return z;
  }
  return 0.55;
}

async function decodeJpeg(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, width: img.naturalWidth, height: img.naturalHeight };
}

// Safari sometimes paints an SVG-wrapped page before its embedded fonts are
// in; drawing it once and throwing that frame away gets a correct second one.
const needsWarmUp = () =>
  /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);

async function renderSheetToPdf(sheet, { reserve, logo, footer, title, filename }) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed; left:-20000px; top:0; pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <>
          <style>{FONT_CSS + SHEET_CSS}</style>
          <div className="pdf-page">
            <div className="pdf-fit">{sheet}</div>
            {logo ? <img className="pdf-logo" src="/keda-black.png" alt="" /> : null}
            {footer ? <div className="con-footer">{footer}</div> : null}
          </div>
        </>
      );
    });
    const page = host.querySelector('.pdf-page');

    await Promise.all(FONT_FILES.map(([f, w]) => document.fonts.load(`${w} 16px '${f}'`, 'KEDA كده ١٢٣')));
    await document.fonts.ready;
    await Promise.all([...page.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));

    fitToPage(page.querySelector('.pdf-fit'), PAGE_HEIGHT - reserve);

    const options = {
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      pixelRatio: 2.5, // ≈240 dpi on A4 — sharp in print, a few hundred KB
      quality: 0.92,
      backgroundColor: '#ffffff',
      fontEmbedCSS: await embeddedFontCss(),
      cacheBust: false,
    };
    if (needsWarmUp()) await toJpeg(page, options);
    const { bytes, width, height } = await decodeJpeg(await toJpeg(page, options));
    triggerDownload(jpegToPdf(bytes, width, height, title), filename);
  } finally {
    root.unmount();
    host.remove();
  }
}

// Keeps Arabic (and any other letters) in the file name; the old
// [^a-z0-9] rule turned an Arabic title into "-.pdf".
function fileName(base, fallback) {
  const clean = String(base || '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  return `${clean || fallback}.pdf`;
}

export async function downloadInvoicePdf(invoice) {
  await renderSheetToPdf(<InvoiceSheet invoice={invoice} />, {
    reserve: 150, // the logo in the bottom corner
    logo: true,
    title: invoice.projectName,
    filename: fileName(invoice.projectName, 'invoice'),
  });
}

export async function downloadPlanPdf(plan) {
  await renderSheetToPdf(<PlanSheet plan={plan} kicker="Plan" />, {
    reserve: 150,
    logo: true,
    title: plan.name,
    filename: fileName(plan.name, 'plan'),
  });
}

export async function downloadProposalPdf(plan, clientName) {
  await renderSheetToPdf(<PlanSheet plan={plan} kicker="Proposal" clientName={clientName || ''} />, {
    reserve: 150,
    logo: true,
    title: plan.name,
    filename: `proposal-${fileName(clientName?.trim() || plan.name, 'proposal')}`,
  });
}

export async function downloadContractPdf(contract) {
  await renderSheetToPdf(<ContractSheet contract={contract} />, {
    reserve: 56, // the footer line
    logo: false,
    footer: `${STUDIO_NAME} · Cairo, Egypt`,
    title: contract.title,
    filename: fileName(contract.title, 'contract'),
  });
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
