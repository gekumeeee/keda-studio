import { NextResponse } from 'next/server';
import { getPlans, savePlans, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => typeof i === 'string');
}

export async function GET() {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  return NextResponse.json(await getPlans());
}

export async function POST(request) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const body = await request.json();
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
  }
  const plans = await getPlans();
  const plan = {
    id: uid(),
    name: body.name.trim(),
    description: (body.description || '').trim(),
    currency: (body.currency || 'LE').trim() || 'LE',
    price: (body.price || '').trim(),
    cycle: (body.cycle || '').trim(),
    items: normalizeItems(body.items),
    updated: new Date().toISOString(),
  };
  plans.unshift(plan);
  await savePlans(plans);
  return NextResponse.json(plan, { status: 201 });
}
