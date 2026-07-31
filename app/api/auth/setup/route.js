import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUsers, saveUsers, uid } from '@/lib/store';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/auth';

// Creates the very first (owner) account. Only works while no users exist —
// after that, new users can only be created by the owner from inside the
// admin panel (POST /api/users), never through this endpoint again.
export async function POST(request) {
  const users = await getUsers();
  if (users.length > 0) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 });
  }
  const body = await request.json();
  const username = (body.username || '').trim();
  const password = body.password || '';
  if (username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  const owner = {
    id: uid(),
    username,
    passwordHash: await hashPassword(password),
    role: 'owner',
    permissions: null,
    createdAt: new Date().toISOString(),
  };
  await saveUsers([owner]);

  const token = await createSessionToken(owner.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ id: owner.id, username: owner.username, role: owner.role });
}
