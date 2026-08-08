import { NextResponse } from 'next/server';
import { getContracts, saveContracts } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    label: typeof it?.label === 'string' ? it.label : '',
    quantity: typeof it?.quantity === 'string' ? it.quantity : '',
    amount: typeof it?.amount === 'string' ? it.amount : '',
  }));
}

export async function PUT(request, { params }) {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const contracts = await getContracts();
  const idx = contracts.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const base = contracts[idx];
  contracts[idx] = {
    ...base,
    title: body.title?.trim() || base.title,
    partyType: ['client', 'employee'].includes(body.partyType) ? body.partyType : base.partyType,
    clientId: body.clientId !== undefined ? body.clientId.trim() : (base.clientId || ''),
    partyName: body.partyName !== undefined ? body.partyName.trim() : base.partyName,
    role: body.role !== undefined ? body.role.trim() : base.role,
    startDate: body.startDate !== undefined ? body.startDate.trim() : base.startDate,
    endDate: body.endDate !== undefined ? body.endDate.trim() : base.endDate,
    currency: body.currency !== undefined ? (body.currency.trim() || 'LE') : base.currency,
    items: body.items !== undefined ? normalizeItems(body.items) : base.items,
    terms: body.terms !== undefined ? (typeof body.terms === 'string' ? body.terms : '') : base.terms,
    notes: body.notes !== undefined ? (typeof body.notes === 'string' ? body.notes : '') : base.notes,
    updated: new Date().toISOString(),
  };
  await saveContracts(contracts);
  return NextResponse.json(contracts[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  const { id } = await params;
  const contracts = await getContracts();
  await saveContracts(contracts.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
