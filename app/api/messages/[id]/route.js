import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/store';

export async function DELETE(request, { params }) {
  const { id } = await params;
  const messages = await getMessages();
  await saveMessages(messages.filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
