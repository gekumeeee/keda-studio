import { NextResponse } from 'next/server';
import { getInvoices, saveInvoices, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => ({
    title: typeof s?.title === 'string' ? s.title : '',
    price: typeof s?.price === 'string' ? s.price : '',
    items: Array.isArray(s?.items) ? s.items.filter((i) => typeof i === 'string') : [],
  }));
}

export async function GET() {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  return NextResponse.json(await getInvoices());
}

export async function POST(request) {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.projectName?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  const invoices = await getInvoices();
  const invoice = {
    id: uid(),
    clientName: (body.clientName || '').trim(),
    projectName: body.projectName.trim(),
    currency: (body.currency || 'LE').trim() || 'LE',
    discount: (body.discount || '').trim(),
    sections: normalizeSections(body.sections),
    updated: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  await saveInvoices(invoices);
  return NextResponse.json(invoice, { status: 201 });
}
