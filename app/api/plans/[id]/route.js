import { NextResponse } from 'next/server';
import { getPlans, savePlans } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => typeof i === 'string');
}

export async function PUT(request, { params }) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json();
  const plans = await getPlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  plans[idx] = {
    ...plans[idx],
    name: body.name?.trim() || plans[idx].name,
    description: body.description !== undefined ? body.description.trim() : plans[idx].description,
    currency: body.currency !== undefined ? body.currency.trim() || 'LE' : plans[idx].currency,
    price: body.price !== undefined ? body.price.trim() : plans[idx].price,
    cycle: body.cycle !== undefined ? body.cycle.trim() : plans[idx].cycle,
    items: body.items !== undefined ? normalizeItems(body.items) : plans[idx].items,
    updated: new Date().toISOString(),
  };
  await savePlans(plans);
  return NextResponse.json(plans[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const { id } = await params;
  const plans = await getPlans();
  await savePlans(plans.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
