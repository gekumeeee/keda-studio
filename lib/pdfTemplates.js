'use client';

// PDF downloads for the admin's Invoices, Plans (and proposals) and Contracts.
// Loaded with import() on click, so none of this is in the admin's first load.
//
// How: the document is rendered as ordinary HTML (components/admin/PdfSheets.js)
// in an off-screen A4-sized box, the browser lays it out, and that box is
// captured as a high-resolution image (lib/sheetCapture.js) and placed on a
// single A4 PDF page (lib/jpegPdf.js).
//
// Why not a PDF layout library: this used @react-pdf/renderer, and its bidi
// step crashes on real Arabic — any wrapped line containing the لا ligature,
// any wrapped mixed Arabic/English line, and even one short line with
// tanween or Arabic-Indic digits ("٢٠ تصميم شهريًا") threw inside the
// library, so the download silently did nothing. The browser's own text
// engine has none of those problems. It also makes "always one page" exact:
// the laid-out height is measured, and the sheet is scaled down until it
// fits, instead of estimated from character counts.

import { jpegToPdf } from '@/lib/jpegPdf';
import { captureOffscreen, downloadBlob, safeFileName } from '@/lib/sheetCapture';
import {
  SHEET_CSS, PAGE_WIDTH, PAGE_HEIGHT, STUDIO_NAME,
  InvoiceSheet, PlanSheet, ContractSheet,
} from '@/components/admin/PdfSheets';

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

async function renderSheetToPdf(sheet, { reserve, logo, footer, title, filename }) {
  const dataUrl = await captureOffscreen(
    <div className="pdf-page">
      <div className="pdf-fit">{sheet}</div>
      {logo ? <img className="pdf-logo" src="/keda-black.png" alt="" /> : null}
      {footer ? <div className="con-footer">{footer}</div> : null}
    </div>,
    {
      selector: '.pdf-page',
      css: SHEET_CSS,
      format: 'jpeg',
      pixelRatio: 2.5, // ≈240 dpi on A4 — sharp in print, a few hundred KB
      prepare: (page) => fitToPage(page.querySelector('.pdf-fit'), PAGE_HEIGHT - reserve),
    }
  );
  const { bytes, width, height } = await decodeJpeg(dataUrl);
  downloadBlob(jpegToPdf(bytes, width, height, title), filename);
}

export async function downloadInvoicePdf(invoice) {
  await renderSheetToPdf(<InvoiceSheet invoice={invoice} />, {
    reserve: 150, // the logo in the bottom corner
    logo: true,
    title: invoice.projectName,
    filename: `${safeFileName(invoice.projectName, 'invoice')}.pdf`,
  });
}

export async function downloadPlanPdf(plan) {
  await renderSheetToPdf(<PlanSheet plan={plan} kicker="Plan" />, {
    reserve: 150,
    logo: true,
    title: plan.name,
    filename: `${safeFileName(plan.name, 'plan')}.pdf`,
  });
}

export async function downloadProposalPdf(plan, clientName) {
  await renderSheetToPdf(<PlanSheet plan={plan} kicker="Proposal" clientName={clientName || ''} />, {
    reserve: 150,
    logo: true,
    title: plan.name,
    filename: `proposal-${safeFileName(clientName?.trim() || plan.name, 'proposal')}.pdf`,
  });
}

export async function downloadContractPdf(contract) {
  await renderSheetToPdf(<ContractSheet contract={contract} />, {
    reserve: 56, // the footer line
    logo: false,
    footer: `${STUDIO_NAME} · Cairo, Egypt`,
    title: contract.title,
    filename: `${safeFileName(contract.title, 'contract')}.pdf`,
  });
}
