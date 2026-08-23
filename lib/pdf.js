// Renders a URL to a PDF with a real Chromium instance (Playwright) — the
// whole reason for this over @react-pdf/renderer: full HTML/CSS layout and
// genuine browser text shaping, which is what actually gets Arabic RTL right
// (see SPEC.md §1 — this is a hard requirement, not a preference).
//
// A fresh browser per export, closed in a `finally`, rather than a shared
// long-lived instance: this is a single-admin internal tool exporting one
// report at a time, not a high-throughput service — the simplicity of "no
// process to manage the lifecycle of" outweighs the few hundred ms a cold
// launch costs.
import { chromium } from 'playwright';

export async function renderReportPdf(url) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    // Printing before the Arabic web fonts finish downloading would bake the
    // fallback system font into the PDF instead of Lalezar/Cairo.
    await page.evaluate(() => document.fonts.ready);
    return await page.pdf({
      width: '1920px',
      height: '1080px',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } finally {
    await browser.close();
  }
}
