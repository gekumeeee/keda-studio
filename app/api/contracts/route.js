import { NextResponse } from 'next/server';
import { getContracts, saveContracts, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => ({
    label: typeof it?.label === 'string' ? it.label : '',
    quantity: typeof it?.quantity === 'string' ? it.quantity : '',
    amount: typeof it?.amount === 'string' ? it.amount : '',
  }));
}

function normalizeContract(body, base = {}) {
  return {
    title: body.title !== undefined ? (body.title || '').trim() : base.title,
    partyType: ['client', 'employee'].includes(body.partyType) ? body.partyType : (base.partyType || 'client'),
    clientId: body.clientId !== undefined ? (body.clientId || '').trim() : (base.clientId || ''),
    partyName: body.partyName !== undefined ? (body.partyName || '').trim() : base.partyName,
    role: body.role !== undefined ? (body.role || '').trim() : (base.role || ''),
    startDate: body.startDate !== undefined ? (body.startDate || '').trim() : (base.startDate || ''),
    endDate: body.endDate !== undefined ? (body.endDate || '').trim() : (base.endDate || ''),
    currency: body.currency !== undefined ? ((body.currency || 'LE').trim() || 'LE') : (base.currency || 'LE'),
    items: body.items !== undefined ? normalizeItems(body.items) : (base.items || []),
    terms: body.terms !== undefined ? (typeof body.terms === 'string' ? body.terms : '') : (base.terms || ''),
    notes: body.notes !== undefined ? (typeof body.notes === 'string' ? body.notes : '') : (base.notes || ''),
  };
}

export async function GET() {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  return NextResponse.json(await getContracts());
}

export async function POST(request) {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Contract title is required' }, { status: 400 });
  }
  const contracts = await getContracts();
  const contract = {
    id: uid(),
    ...normalizeContract(body),
    updated: new Date().toISOString(),
  };
  contracts.unshift(contract);
  await saveContracts(contracts);
  return NextResponse.json(contract, { status: 201 });
}
