import { NextResponse } from 'next/server';
import { getInvoices, saveInvoices } from '@/lib/store';

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map((s) => ({
    title: typeof s?.title === 'string' ? s.title : '',
    price: typeof s?.price === 'string' ? s.price : '',
    items: Array.isArray(s?.items) ? s.items.filter((i) => typeof i === 'string') : [],
  }));
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const invoices = await getInvoices();
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  invoices[idx] = {
    ...invoices[idx],
    clientName: body.clientName !== undefined ? body.clientName.trim() : invoices[idx].clientName,
    projectName: body.projectName?.trim() || invoices[idx].projectName,
    currency: body.currency !== undefined ? body.currency.trim() || 'LE' : invoices[idx].currency,
    discount: body.discount !== undefined ? body.discount.trim() : invoices[idx].discount,
    sections: body.sections !== undefined ? normalizeSections(body.sections) : invoices[idx].sections,
    updated: new Date().toISOString(),
  };
  await saveInvoices(invoices);
  return NextResponse.json(invoices[idx]);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const invoices = await getInvoices();
  await saveInvoices(invoices.filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
