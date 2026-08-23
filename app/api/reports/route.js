import { NextResponse } from 'next/server';
import { getReports, saveReports, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

// GET /api/reports?clientId=X — every month on file for one client, newest
// first. The monthly entry screen uses this to list existing months and to
// find the previous month's metrics for the change-% comparison.
export async function GET(request) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const clientId = new URL(request.url).searchParams.get('clientId');
  const reports = await getReports();
  const filtered = clientId ? reports.filter((r) => r.clientId === clientId) : reports;
  return NextResponse.json([...filtered].sort((a, b) => b.month.localeCompare(a.month)));
}

export async function POST(request) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.clientId || !body.month) {
    return NextResponse.json({ error: 'clientId and month are required' }, { status: 400 });
  }
  const reports = await getReports();
  if (reports.some((r) => r.clientId === body.clientId && r.month === body.month)) {
    return NextResponse.json({ error: 'A report already exists for this client and month' }, { status: 409 });
  }
  const report = {
    id: uid(),
    clientId: body.clientId,
    month: body.month,
    status: 'draft',
    reach: '', engagement: '', newFollowers: '', messages: '', ytViews: '',
    source: 'manual',
    deliveredCounts: {},
    topPosts: [
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
      { postUrl: '', imageUrl: '', reach: '', engagement: '', whyItWorked: '' },
    ],
    summaryText: '', worked: '', didntWork: '', needsDecision: '',
    nextMonthPlan: { pillars: [], events: [] },
    shareToken: uid(),
    pdfUrl: '', sentAt: '', openedAt: '',
    updated: new Date().toISOString(),
  };
  reports.push(report);
  await saveReports(reports);
  return NextResponse.json(report, { status: 201 });
}
