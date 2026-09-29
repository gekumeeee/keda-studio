import { NextResponse } from 'next/server';
import { getContent, saveContent } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { normalizePost } from '@/lib/contentPosts';

export async function PUT(request, { params }) {
  const gate = await requirePermission('content');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const posts = await getContent({ fresh: true });
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  posts[idx] = {
    ...posts[idx],
    ...normalizePost(body, posts[idx]),
    updated: new Date().toISOString(),
  };
  await saveContent(posts);
  return NextResponse.json(posts[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('content');
  if (gate.error) return gate.error;
  const { id } = await params;
  const posts = await getContent({ fresh: true });
  const kept = posts.filter((p) => p.id !== id);
  if (kept.length === posts.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await saveContent(kept);
  return NextResponse.json({ ok: true });
}
