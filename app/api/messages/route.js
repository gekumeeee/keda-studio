import { NextResponse } from 'next/server';
import { getMessages, saveMessages, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  const gate = await requirePermission('messages');
  if (gate.error) return gate.error;
  return NextResponse.json(await getMessages());
}

// Intentionally NOT gated — this is the public contact form's submit endpoint.
export async function POST(request) {
  const body = await request.json();
  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 });
  }
  const messages = await getMessages();
  const message = {
    id: uid(),
    name: body.name.trim(),
    email: body.email.trim(),
    phone: (body.phone || '').trim(),
    contactMethod: ['whatsapp', 'email', 'call'].includes(body.contactMethod) ? body.contactMethod : 'whatsapp',
    message: body.message.trim(),
    received: new Date().toISOString(),
  };
  messages.unshift(message);
  await saveMessages(messages);
  return NextResponse.json(message, { status: 201 });
}
