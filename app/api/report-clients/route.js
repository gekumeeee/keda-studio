import { NextResponse } from 'next/server';
import { getReportClients, saveReportClients, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

export async function GET() {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  return NextResponse.json(await getReportClients({ fresh: true }));
}

export async function POST(request) {
  const gate = await requirePermission('reports');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  if (!str(body.name)) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const clients = await getReportClients({ fresh: true });
  const client = {
    id: uid(),
    name: str(body.name),
    logoUrl: str(body.logoUrl),
    primaryColor: body.primaryColor || '#2F3A44',
    secondaryColor: body.secondaryColor || '#8791A0',
    fbPageId: str(body.fbPageId),
    igId: str(body.igId),
    ytChannelId: str(body.ytChannelId),
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
