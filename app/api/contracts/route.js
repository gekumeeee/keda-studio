import { NextResponse } from 'next/server';
import { getContracts, saveContracts, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

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
    title: body.title !== undefined ? str(body.title) : base.title,
    partyType: ['client', 'employee'].includes(body.partyType) ? body.partyType : (base.partyType || 'client'),
    clientId: body.clientId !== undefined ? str(body.clientId) : (base.clientId || ''),
    partyName: body.partyName !== undefined ? str(body.partyName) : base.partyName,
    role: body.role !== undefined ? str(body.role) : (base.role || ''),
    startDate: body.startDate !== undefined ? str(body.startDate) : (base.startDate || ''),
    endDate: body.endDate !== undefined ? str(body.endDate) : (base.endDate || ''),
    currency: body.currency !== undefined ? (str(body.currency) || 'LE') : (base.currency || 'LE'),
    items: body.items !== undefined ? normalizeItems(body.items) : (base.items || []),
    terms: body.terms !== undefined ? (typeof body.terms === 'string' ? body.terms : '') : (base.terms || ''),
    notes: body.notes !== undefined ? (typeof body.notes === 'string' ? body.notes : '') : (base.notes || ''),
  };
}

export async function GET() {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  return NextResponse.json(await getContracts({ fresh: true }));
}

export async function POST(request) {
  const gate = await requirePermission('contracts');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  if (!str(body.title)) {
    return NextResponse.json({ error: 'Contract title is required' }, { status: 400 });
  }
  const contracts = await getContracts({ fresh: true });
  const contract = {
    id: uid(),
    ...normalizeContract(body),
    updated: new Date().toISOString(),
  };
  contracts.unshift(contract);
  await saveContracts(contracts);
  return NextResponse.json(contract, { status: 201 });
}
