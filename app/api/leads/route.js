import { NextResponse } from 'next/server';
import { getLeads, saveLeads, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody } from '@/lib/apiInput';
import { normalizeLead, normalizeNote } from '@/lib/leads';

export async function GET() {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  return NextResponse.json(await getLeads({ fresh: true }));
}

export async function POST(request) {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  const lead = normalizeLead(body);
  if (!lead.name && !lead.company) {
    return NextResponse.json({ error: 'A name or a company is required' }, { status: 400 });
  }
  const now = new Date().toISOString();
  const record = {
    id: uid(),
    ...lead,
    notes: typeof body.note === 'string' && body.note.trim()
      ? [normalizeNote({ id: uid(), at: now, by: gate.user.username, text: body.note })]
      : [],
    created: now,
    updated: now,
  };
  const leads = await getLeads({ fresh: true });
  leads.unshift(record);
  await saveLeads(leads);
  return NextResponse.json(record, { status: 201 });
}
