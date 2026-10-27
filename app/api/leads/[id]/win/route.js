import { NextResponse } from 'next/server';
import { getLeads, saveLeads, getClients, saveClients, uid } from '@/lib/store';
import { requirePermission, hasPermission } from '@/lib/auth';
import { normalizeNote } from '@/lib/leads';

// Marks a lead won and turns it into a client in one step: a client record
// is created (or an existing one with the same name is reused) and the lead
// points at it. Creating a client needs the clients permission as well.
export async function POST(request, { params }) {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  if (!hasPermission(gate.user, 'clients')) {
    return NextResponse.json({ error: 'You also need the Clients permission to add a client' }, { status: 403 });
  }
  const { id } = await params;
  const leads = await getLeads({ fresh: true });
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const lead = leads[idx];
  const name = (lead.company || lead.name).trim();
  if (!name) return NextResponse.json({ error: 'The lead needs a name first' }, { status: 400 });

  const clients = await getClients({ fresh: true });
  let client = clients.find((c) => c.id === lead.clientId) || clients.find((c) => c.name.trim().toLowerCase() === name.toLowerCase());
  if (!client) {
    client = { id: uid(), name, logo: '', cardImage: '', notes: '', added: new Date().toISOString() };
    clients.unshift(client);
    await saveClients(clients);
  }
  const now = new Date().toISOString();
  leads[idx] = {
    ...lead,
    stage: 'won',
    clientId: client.id,
    notes: [...(lead.notes || []), normalizeNote({ id: uid(), at: now, by: gate.user.username, kind: 'stage', text: `Won — now the client "${client.name}"` })],
    updated: now,
  };
  await saveLeads(leads);
  return NextResponse.json({ lead: leads[idx], client });
}
