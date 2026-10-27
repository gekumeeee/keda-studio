import { NextResponse } from 'next/server';
import { getLeads, saveLeads, getMessages, uid } from '@/lib/store';
import { requirePermission, hasPermission } from '@/lib/auth';
import { leadFromMessage } from '@/lib/leads';

// Adds every contact-form message that isn't in the pipeline yet as a new
// lead — for messages that came in before the CRM existed.
export async function POST() {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  if (!hasPermission(gate.user, 'messages')) {
    return NextResponse.json({ error: 'You also need the Messages permission' }, { status: 403 });
  }
  const [leads, messages] = await Promise.all([getLeads({ fresh: true }), getMessages({ fresh: true })]);
  const known = new Set(leads.map((l) => l.messageId).filter(Boolean));
  const added = messages
    .filter((m) => m.id && !known.has(m.id))
    .map((m) => ({ id: uid(), ...leadFromMessage(m), created: m.received || new Date().toISOString(), updated: new Date().toISOString() }));
  if (added.length) await saveLeads([...added, ...leads]);
  return NextResponse.json({ added: added.length, leads: [...added, ...leads] });
}
