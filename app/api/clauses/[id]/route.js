import { NextResponse } from 'next/server';
import { getClauses, saveClauses } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function PUT(request, { params }) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const clauses = await getClauses();
  const idx = clauses.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  clauses[idx] = {
    ...clauses[idx],
    name: body.name?.trim() || clauses[idx].name,
    body: body.body !== undefined ? body.body.trim() : clauses[idx].body,
    updated: new Date().toISOString(),
  };
  await saveClauses(clauses);
  return NextResponse.json(clauses[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const { id } = await params;
  const clauses = await getClauses();
  await saveClauses(clauses.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
