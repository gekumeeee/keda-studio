import { NextResponse } from 'next/server';
import { getReports, getReportClients } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { renderReportPdf } from '@/lib/pdf';
import { reportFileName } from '@/lib/reportMath';

export async function POST(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;

  const [reports, clients] = await Promise.all([getReports(), getReportClients()]);
  const report = reports.find((r) => r.id === id);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const client = clients.find((c) => c.id === report.clientId);
  if (!client) return NextResponse.json({ error: 'Report client not found' }, { status: 404 });

  // Same origin as this request, not a hardcoded host — Playwright is
  // navigating to our own /report-template route, wherever this server
  // actually happens to be running.
  const origin = new URL(request.url).origin;
  let pdfBuffer;
  try {
    pdfBuffer = await renderReportPdf(`${origin}/report-template/${id}`);
  } catch (err) {
    console.error('[reports/export] PDF render failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${reportFileName(client.name, report.month)}"`,
    },
  });
}
