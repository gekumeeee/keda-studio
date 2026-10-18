import { NextResponse } from 'next/server';
import { getInvoices, saveInvoices, uid } from '@/lib/store';
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

export async function GET() {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  return NextResponse.json(await getInvoices({ fresh: true }));
}

export async function POST(request) {
  const gate = await requirePermission('invoices');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  if (!str(body.projectName)) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  const invoices = await getInvoices({ fresh: true });
  const status = ['draft', 'sent', 'paid'].includes(body.status) ? body.status : 'draft';
  const invoice = {
    id: uid(),
    clientId: str(body.clientId),
    clientName: str(body.clientName),
    projectName: str(body.projectName),
    currency: str(body.currency) || 'LE',
    discount: str(body.discount),
    sections: normalizeSections(body.sections),
    status,
    issueDate: str(body.issueDate),
    dueDate: str(body.dueDate),
    // paidDate is server-managed: only stamped when the invoice is created paid
    paidDate: status === 'paid' ? new Date().toISOString() : '',
    updated: new Date().toISOString(),
  };
  invoices.unshift(invoice);
  await saveInvoices(invoices);
  return NextResponse.json(invoice, { status: 201 });
}
