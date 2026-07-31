import { NextResponse } from 'next/server';
import { getUsers, saveUsers, uid } from '@/lib/store';
import { requireOwner, hashPassword, emptyPermissions, PERMISSIONS } from '@/lib/auth';

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

// Only the owner can list/create users — this is the whole point of the
// role split, so it isn't permission-grantable like the other sections.
export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;
  const users = await getUsers();
  return NextResponse.json(users.map(stripHash));
}

export async function POST(request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const body = await request.json();
  const username = (body.username || '').trim();
  const password = body.password || '';
  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const users = await getUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return NextResponse.json({ error: 'That username is already taken' }, { status: 409 });
  }

  const user = {
    id: uid(),
    username,
    passwordHash: await hashPassword(password),
    role: 'member',
    permissions: normalizePermissions(body.permissions),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers(users);
  return NextResponse.json(stripHash(user), { status: 201 });
}
