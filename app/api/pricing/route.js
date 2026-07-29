import { NextResponse } from 'next/server';
import { getPricing, savePricing } from '@/lib/store';

function normalizeServices(services) {
  if (!Array.isArray(services)) return [];
  return services.map((s) => ({
    name: typeof s?.name === 'string' ? s.name : '',
    price: typeof s?.price === 'string' ? s.price : '',
    note: typeof s?.note === 'string' ? s.note : '',
  }));
}

export async function GET() {
  return NextResponse.json(await getPricing());
}

export async function PUT(request) {
  const body = await request.json();
  const pricing = {
    heading: typeof body.heading === 'string' ? body.heading : '',
    intro: typeof body.intro === 'string' ? body.intro : '',
    currency: (body.currency || 'LE').trim() || 'LE',
    services: normalizeServices(body.services),
  };
  await savePricing(pricing);
  return NextResponse.json(pricing);
}
