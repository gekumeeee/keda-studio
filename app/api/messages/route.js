import { NextResponse } from 'next/server';
import { getMessages, saveMessages, uid, getSettings } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { notifyNewMessage } from '@/lib/notify';

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

  // Best-effort, and deliberately after the save: the stored message is the
  // source of truth, so a missing API key, a Resend outage or a rejected
  // address must never turn a successfully-received enquiry into an error
  // for the visitor. Awaited rather than fired-and-forgotten because a
  // serverless function can be frozen the moment it returns, which would
  // cut the request off mid-flight; lib/notify.js caps how long that wait
  // can be.
  try {
    const status = await notifyNewMessage(message, await getSettings());
    if (status !== 'sent') console.warn(`[contact] notification ${status}`);
  } catch (err) {
    console.error('[contact] notification failed — message is still saved:', err);
  }

  return NextResponse.json(message, { status: 201 });
}
