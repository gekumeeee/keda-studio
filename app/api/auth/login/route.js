import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUsers } from '@/lib/store';
import {
  verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS,
  loginLocked, recordFailedLogin, clearFailedLogins,
} from '@/lib/auth';
import { clientIp } from '@/lib/spamGuard';
import { readBody, badBody } from '@/lib/apiInput';

export async function POST(request) {
  const ip = clientIp(request);
  if (loginLocked(ip)) {
    return NextResponse.json({ error: 'Too many sign-in attempts — wait a few minutes and try again' }, { status: 429 });
  }

  const body = await readBody(request);
  if (!body) return badBody();
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const users = await getUsers({ fresh: true });
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  // Same generic error whether the username doesn't exist or the password is
  // wrong — don't help an attacker enumerate valid usernames.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    recordFailedLogin(ip);
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }
  clearFailedLogins(ip);

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
