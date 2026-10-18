import { NextResponse } from 'next/server';
import { getPlans, savePlans, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((i) => typeof i === 'string');
}

export async function GET() {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  return NextResponse.json(await getPlans({ fresh: true }));
}

export async function POST(request) {
  const gate = await requirePermission('plans');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  if (!str(body.name)) {
    return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
  }
  const plans = await getPlans({ fresh: true });
  const plan = {
    id: uid(),
    name: str(body.name),
    description: str(body.description),
    currency: str(body.currency) || 'LE',
    price: str(body.price),
    cycle: str(body.cycle),
    items: normalizeItems(body.items),
    updated: new Date().toISOString(),
  };
  plans.unshift(plan);
  await savePlans(plans);
  return NextResponse.json(plan, { status: 201 });
}
