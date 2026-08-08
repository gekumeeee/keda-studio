import { NextResponse } from 'next/server';
import { getClauses, saveClauses, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  return NextResponse.json(await getClauses());
}

export async function POST(request) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Clause name is required' }, { status: 400 });
  }
  const clauses = await getClauses();
  const clause = {
    id: uid(),
    name: body.name.trim(),
    body: (body.body || '').trim(),
    updated: new Date().toISOString(),
  };
  clauses.unshift(clause);
  await saveClauses(clauses);
  return NextResponse.json(clause, { status: 201 });
}
