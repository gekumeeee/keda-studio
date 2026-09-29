import { NextResponse } from 'next/server';
import { getContent, saveContent, getClients, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { normalizePost } from '@/lib/contentPosts';

// The content calendar. GET also hands back the client list (names and logos
// only) for the post form's client picker: a content writer may have access
// to this section alone, and /api/clients would refuse them.
export async function GET() {
  const gate = await requirePermission('content');
  if (gate.error) return gate.error;
  const [posts, clients] = await Promise.all([getContent({ fresh: true }), getClients()]);
  return NextResponse.json({
    posts,
    clients: clients.map((c) => ({ id: c.id, name: c.name, logo: c.logo || '' })),
  });
}

export async function POST(request) {
  const gate = await requirePermission('content');
  if (gate.error) return gate.error;
  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();
  const post = {
    id: uid(),
    ...normalizePost(body),
    createdBy: gate.user.username,
    createdAt: now,
    updated: now,
  };
  const posts = await getContent({ fresh: true });
  posts.push(post);
  await saveContent(posts);
  return NextResponse.json(post, { status: 201 });
}
