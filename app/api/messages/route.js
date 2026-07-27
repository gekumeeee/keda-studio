import { NextResponse } from 'next/server';
import { getMessages, saveMessages, uid } from '@/lib/store';

export async function GET() {
  return NextResponse.json(await getMessages());
}

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
    message: body.message.trim(),
    received: new Date().toISOString(),
  };
  messages.unshift(message);
  await saveMessages(messages);
  return NextResponse.json(message, { status: 201 });
}
