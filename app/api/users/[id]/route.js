import { NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/store';
import { requireUser, hashPassword, emptyPermissions, PERMISSIONS } from '@/lib/auth';

function stripHash(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}
function normalizePermissions(input) {
  const perms = emptyPermissions();
  if (input && typeof input === 'object') {
    for (const key of PERMISSIONS) perms[key] = !!input[key];
  }
  return perms;
}

// A user may always edit their own username/password. Only the owner may
// also edit *other* users' permissions — role itself is immutable (set once
// at creation) so there's no path to self-promote to owner via this route.
export async function PUT(request, { params }) {
  const { id } = await params;
  const gate = await requireUser();
  if (gate.error) return gate.error;
  const { user: requester } = gate;

  const isSelf = requester.id === id;
  if (!isSelf && requester.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const next = { ...users[idx] };

  if (typeof body.username === 'string' && body.username.trim()) {
    const username = body.username.trim();
    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }
    if (users.some((u) => u.id !== id && u.username.toLowerCase() === username.toLowerCase())) {
      return NextResponse.json({ error: 'That username is already taken' }, { status: 409 });
    }
    next.username = username;
  }
  if (typeof body.password === 'string' && body.password) {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    next.passwordHash = await hashPassword(body.password);
  }
  // Only the owner can change permissions, and only for non-owner accounts —
  // the owner's access is always implicitly "everything" (see userPermissions()).
  if (requester.role === 'owner' && next.role !== 'owner' && body.permissions !== undefined) {
    next.permissions = normalizePermissions(body.permissions);
  }

  users[idx] = next;
  await saveUsers(users);
  return NextResponse.json(stripHash(next));
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const gate = await requireUser();
  if (gate.error) return gate.error;
  if (gate.user.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const users = await getUsers();
  const target = users.find((u) => u.id === id);
  if (target?.role === 'owner') {
    return NextResponse.json({ error: 'The owner account cannot be deleted' }, { status: 400 });
  }
  await saveUsers(users.filter((u) => u.id !== id));
  return NextResponse.json({ ok: true });
}
