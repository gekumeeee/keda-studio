// Wraps one JPEG into a single-page PDF. That's the whole format for the
// admin's documents now (see lib/pdfTemplates.js): the browser draws the page
// and this only has to place the picture on an A4 sheet — five objects, no
// library needed.
//
//   1 Catalog → 2 Pages → 3 Page (A4, draws /Im0) → 4 the JPEG (DCTDecode,
//   stored as-is) and 5 the content stream that scales it to the page.

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

export function jpegToPdf(jpegBytes, pixelWidth, pixelHeight, title = '') {
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let length = 0;
  const push = (part) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (n, dict, stream) => {
    offsets[n] = length;
    push(`${n} 0 obj\n${dict}\n`);
    if (stream) {
      push('stream\n');
      push(stream);
      push('\nendstream\n');
    }
    push('endobj\n');
  };

  const w = A4_WIDTH_PT.toFixed(2);
  const h = A4_HEIGHT_PT.toFixed(2);
  const drawing = enc.encode(`q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`);
  // PDF strings are latin-1; a title with anything else goes in as UTF-16BE
  // hex so an Arabic document title still reads correctly in the viewer.
  const pdfTitle = title
    ? `<FEFF${[...title].map((ch) => ch.codePointAt(0)).flatMap((cp) => (cp > 0xffff
      ? [0xd800 + ((cp - 0x10000) >> 10), 0xdc00 + ((cp - 0x10000) & 0x3ff)]
      : [cp])).map((u) => u.toString(16).padStart(4, '0')).join('')}>`
    : '';

  push('%PDF-1.4\n%âãÏÓ\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  object(4, `<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`, jpegBytes);
  object(5, `<< /Length ${drawing.length} >>`, drawing);
  object(6, pdfTitle ? `<< /Title ${pdfTitle} /Producer (KEDA admin) >>` : '<< /Producer (KEDA admin) >>');

  const xrefAt = length;
  push(`xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`);
  push(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  return new Blob(chunks, { type: 'application/pdf' });
}
