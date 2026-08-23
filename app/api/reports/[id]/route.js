import { NextResponse } from 'next/server';
import { getReports, saveReports } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

// GET is intentionally unauthenticated-friendly at the field level — it's
// still gated the same as everything else here, but the report TEMPLATE
// route (app/report-template/[id]) reads a report by fetching this same data
// through lib/store.js directly (server-side, no HTTP round trip), not
// through this route — so this endpoint only ever needs to serve the admin.
export async function GET(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;
  const reports = await getReports();
  const report = reports.find((r) => r.id === id);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(report);
}

const EDITABLE_FIELDS = [
  'status', 'reach', 'engagement', 'newFollowers', 'messages', 'ytViews', 'source',
  'deliveredCounts', 'topPosts', 'summaryText', 'worked', 'didntWork', 'needsDecision',
  'nextMonthPlan', 'pdfUrl', 'sentAt', 'openedAt',
];

export async function PUT(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const reports = await getReports();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const cur = reports[idx];
  const next = { ...cur };
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) next[key] = body[key];
  }
  next.updated = new Date().toISOString();
  reports[idx] = next;
  await saveReports(reports);
  return NextResponse.json(next);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;
  const reports = await getReports();
  await saveReports(reports.filter((r) => r.id !== id));
  return NextResponse.json({ ok: true });
}
