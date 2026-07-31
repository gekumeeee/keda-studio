import { NextResponse } from 'next/server';
import { getMessages, saveMessages } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const gate = await requirePermission('messages');
  if (gate.error) return gate.error;
  const { id } = await params;
  const messages = await getMessages();
  await saveMessages(messages.filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
