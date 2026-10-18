import { NextResponse } from 'next/server';
import { getInvoices, saveInvoices } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => ({
    title: typeof s?.title === 'string' ? s.title : '',
    price: typeof s?.price === 'string' ? s.price : '',
    items: Array.isArray(s?.items) ? s.items.filter((i) => typeof i === 'string') : [],
  }));
}

export async function PUT(request, { params }) {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return badBody();
  const invoices = await getInvoices({ fresh: true });
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const base = invoices[idx];
  const status = ['draft', 'sent', 'paid'].includes(body.status) ? body.status : (base.status || 'draft');
  // paidDate is authoritative here, not client-supplied: stamp it the moment an
  // invoice first becomes paid, clear it if it moves back to draft/sent.
  let paidDate = base.paidDate || '';
  if (status === 'paid' && !paidDate) paidDate = new Date().toISOString();
  if (status !== 'paid') paidDate = '';
  invoices[idx] = {
    ...base,
    clientId: body.clientId !== undefined ? str(body.clientId) : (base.clientId || ''),
    clientName: body.clientName !== undefined ? str(body.clientName) : base.clientName,
    projectName: str(body.projectName) || base.projectName,
    currency: body.currency !== undefined ? str(body.currency) || 'LE' : base.currency,
    discount: body.discount !== undefined ? str(body.discount) : base.discount,
    sections: body.sections !== undefined ? normalizeSections(body.sections) : base.sections,
    status,
    issueDate: body.issueDate !== undefined ? str(body.issueDate) : (base.issueDate || ''),
    dueDate: body.dueDate !== undefined ? str(body.dueDate) : (base.dueDate || ''),
    paidDate,
    updated: new Date().toISOString(),
  };
  await saveInvoices(invoices);
  return NextResponse.json(invoices[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  const { id } = await params;
  const invoices = await getInvoices({ fresh: true });
  await saveInvoices(invoices.filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
