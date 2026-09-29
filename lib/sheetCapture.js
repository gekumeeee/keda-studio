'use client';

// Renders a React element off-screen, lets the browser lay it out, and
// captures it as an image. Shared by the document PDFs (lib/pdfTemplates.js)
// and the content-brief export (components/admin/ContentTab.js): both need
// Arabic set by the browser's own text engine, which no PDF or canvas library
// gets fully right.

import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toJpeg, toPng } from 'html-to-image';

// The TTFs in /public/fonts: Cairo carries Arabic and Latin; Bricolage is the
// brand display face. The @font-face rules for these names are in
// globals.css, so they load on screen too; the capture needs them again as
// data: URLs, because it happens inside an SVG image that can't fetch.
export const FONT_FILES = [
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
      embeddedFonts = null; // let the next attempt try again
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

const BLANK_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// Safari sometimes paints an SVG-wrapped page before its embedded fonts are
// in; drawing it once and throwing that frame away gets a correct second one.
const needsWarmUp = () =>
  /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);

// Renders `element` into a hidden host, waits for fonts and images, gives
// `prepare(root)` a chance to adjust the laid-out DOM (the PDFs scale to fit
// here), then captures the node matching `selector`.
export async function captureOffscreen(element, { selector, css = '', format = 'png', pixelRatio = 2, quality = 0.92, prepare } = {}) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed; left:-20000px; top:0; pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <>
          {css ? <style>{css}</style> : null}
          {element}
        </>
      );
    });
    const node = host.querySelector(selector);
    if (!node) throw new Error(`nothing matched ${selector}`);

    await Promise.all(FONT_FILES.map(([f, w]) => document.fonts.load(`${w} 16px '${f}'`, 'KEDA كده ١٢٣')));
    await document.fonts.ready;
    await Promise.all([...node.querySelectorAll('img')].map((img) => img.decode().catch(() => {})));
    if (prepare) prepare(node);

    const rect = node.getBoundingClientRect();
    const options = {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      pixelRatio,
      quality,
      backgroundColor: '#ffffff',
      fontEmbedCSS: await embeddedFontCss(),
      cacheBust: false,
      // An image the capture can't read — a client logo on a site that
      // doesn't allow cross-origin copies — is left blank rather than
      // failing the whole export. Uploaded images (jsDelivr) and our own
      // files are always readable.
      imagePlaceholder: BLANK_PIXEL,
    };
    const capture = format === 'jpeg' ? toJpeg : toPng;
    if (needsWarmUp()) await capture(node, options);
    return await capture(node, options);
  } finally {
    root.unmount();
    host.remove();
  }
}

// Scales `el` down, if it has to, until it fits `frameHeight`. Its width is
// widened by the same factor first, so after scaling it still spans
// `frameWidth` — lines re-wrap longer instead of the block going narrow.
// Never below `min`: past that it stops being readable anyway.
export function scaleToFit(el, frameWidth, frameHeight, min = 0.55) {
  for (let z = 1; z >= min; z -= 0.01) {
    el.style.width = `${frameWidth / z}px`;
    el.style.transform = `scale(${z})`;
    if (el.getBoundingClientRect().height <= frameHeight) return z;
  }
  return min;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

// Keeps Arabic (and any other letters) in a file name.
export function safeFileName(base, fallback) {
  const clean = String(base || '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  return clean || fallback;
}
