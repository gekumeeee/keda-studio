import { NextResponse } from 'next/server';
import { getMessages, saveMessages, uid, getSettings } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { notifyNewMessage } from '@/lib/notify';
import { clientIp, isBot, isRateLimited, validateMessage } from '@/lib/spamGuard';

export async function GET() {
  const gate = await requirePermission('messages');
  if (gate.error) return gate.error;
  return NextResponse.json(await getMessages());
}

// Intentionally NOT gated — this is the public contact form's submit
// endpoint. Because it's open and every accepted submission writes to the
// Blob store, the checks in lib/spamGuard.js run before anything is stored.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Answer a bot with the same 201 a real visitor gets: told it failed, a
  // bot retries or moves to another vector; told it succeeded, it stops.
  // Nothing is saved and no email goes out.
  if (isBot(body)) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: 'Too many messages just now — please try again in a few minutes' },
      { status: 429 }
    );
  }

  const { error, data } = validateMessage(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const messages = await getMessages();
  const message = {
    id: uid(),
    name: data.name,
    email: data.email,
    phone: data.phone,
    contactMethod: ['whatsapp', 'email', 'call'].includes(body.contactMethod) ? body.contactMethod : 'whatsapp',
    message: data.message,
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
