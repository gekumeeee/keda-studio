import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUsers } from '@/lib/store';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from '@/lib/auth';

export async function POST(request) {
  const body = await request.json();
  const username = (body.username || '').trim();
  const password = body.password || '';
  const users = await getUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  // Same generic error whether the username doesn't exist or the password is
  // wrong — don't help an attacker enumerate valid usernames.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}
