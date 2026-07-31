import { NextResponse } from 'next/server';
import { getClients, saveClients, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  return NextResponse.json(await getClients());
}

export async function POST(request) {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const clients = await getClients();
  const client = {
    id: uid(),
    name: body.name.trim(),
    logo: typeof body.logo === 'string' ? body.logo.trim() : '',
    added: new Date().toISOString(),
  };
  clients.unshift(client);
  await saveClients(clients);
  return NextResponse.json(client, { status: 201 });
}
