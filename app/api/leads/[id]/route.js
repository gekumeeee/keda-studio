import { NextResponse } from 'next/server';
import { getLeads, saveLeads, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody } from '@/lib/apiInput';
import { normalizeLead, normalizeNote, stageOf } from '@/lib/leads';

// Edits a lead. `note` appends to its timeline (notes are never rewritten);
// a stage change is written to the timeline too, so the history shows when
// and by whom a lead moved.
export async function PUT(request, { params }) {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return badBody();
  const leads = await getLeads({ fresh: true });
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const before = leads[idx];
  const next = normalizeLead(body, before);
  const now = new Date().toISOString();
  const notes = [...(before.notes || [])];
  if (next.stage !== before.stage) {
    notes.push(normalizeNote({ id: uid(), at: now, by: gate.user.username, kind: 'stage', text: `Moved to ${stageOf(next.stage).label}` }));
  }
  if (typeof body.note === 'string' && body.note.trim()) {
    notes.push(normalizeNote({ id: uid(), at: now, by: gate.user.username, text: body.note }));
  }
  leads[idx] = { ...before, ...next, notes: notes.slice(-200), updated: now };
  await saveLeads(leads);
  return NextResponse.json(leads[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('crm');
  if (gate.error) return gate.error;
  const { id } = await params;
  const leads = await getLeads({ fresh: true });
  await saveLeads(leads.filter((l) => l.id !== id));
  return NextResponse.json({ ok: true });
}
