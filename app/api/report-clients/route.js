import { NextResponse } from 'next/server';
import { getReportClients, saveReportClients, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  return NextResponse.json(await getReportClients());
}

export async function POST(request) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const clients = await getReportClients();
  const client = {
    id: uid(),
    name: body.name.trim(),
    logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl.trim() : '',
    primaryColor: body.primaryColor || '#2F3A44',
    secondaryColor: body.secondaryColor || '#8791A0',
    fbPageId: (body.fbPageId || '').trim(),
    igId: (body.igId || '').trim(),
    ytChannelId: (body.ytChannelId || '').trim(),
    packageJson: typeof body.packageJson === 'object' && body.packageJson ? body.packageJson : {},
    price: typeof body.price === 'string' ? body.price.trim() : (body.price || ''),
    renewalDate: body.renewalDate || '',
    isActive: body.isActive !== false,
    added: new Date().toISOString(),
  };
  clients.unshift(client);
  await saveReportClients(clients);
  return NextResponse.json(client, { status: 201 });
}
