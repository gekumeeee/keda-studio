import { NextResponse } from 'next/server';
import { getReportClients, saveReportClients } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function PUT(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const clients = await getReportClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const cur = clients[idx];
  clients[idx] = {
    ...cur,
    name: body.name?.trim() || cur.name,
    logoUrl: body.logoUrl !== undefined ? String(body.logoUrl).trim() : cur.logoUrl,
    primaryColor: body.primaryColor || cur.primaryColor,
    secondaryColor: body.secondaryColor || cur.secondaryColor,
    fbPageId: body.fbPageId !== undefined ? String(body.fbPageId).trim() : cur.fbPageId,
    igId: body.igId !== undefined ? String(body.igId).trim() : cur.igId,
    ytChannelId: body.ytChannelId !== undefined ? String(body.ytChannelId).trim() : cur.ytChannelId,
    packageJson: typeof body.packageJson === 'object' && body.packageJson ? body.packageJson : cur.packageJson,
    price: body.price !== undefined ? body.price : cur.price,
    renewalDate: body.renewalDate !== undefined ? body.renewalDate : cur.renewalDate,
    isActive: body.isActive !== undefined ? !!body.isActive : cur.isActive,
  };
  await saveReportClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const { id } = await params;
  const clients = await getReportClients();
  await saveReportClients(clients.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
