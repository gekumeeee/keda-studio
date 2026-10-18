import { NextResponse } from 'next/server';
import { getClients, saveClients } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

export async function PUT(request, { params }) {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return badBody();
  const clients = await getClients({ fresh: true });
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  clients[idx] = {
    ...clients[idx],
    name: str(body.name) || clients[idx].name,
    logo: body.logo !== undefined ? str(body.logo) : (clients[idx].logo || ''),
    cardImage: body.cardImage !== undefined ? str(body.cardImage) : (clients[idx].cardImage || ''),
  };
  await saveClients(clients);
  return NextResponse.json(clients[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('clients');
  if (gate.error) return gate.error;
  const { id } = await params;
  const clients = await getClients({ fresh: true });
  await saveClients(clients.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
