import { NextResponse } from 'next/server';
import { getClients, saveClients } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function PUT(request, { params }) {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const clients = await getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  clients[idx] = {
    ...clients[idx],
    name: body.name?.trim() || clients[idx].name,
    logo: body.logo !== undefined ? String(body.logo).trim() : (clients[idx].logo || ''),
  };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  const { id } = await params;
  const clients = await getClients();
  await saveClients(clients.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
