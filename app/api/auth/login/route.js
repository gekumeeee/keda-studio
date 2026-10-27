import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/store';
import {
  verifyPasswordOrDummy, setSessionCookie,
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
  // wrong — don't help an attacker enumerate valid usernames. An unknown
  // username is still checked against a stand-in hash, so it takes as long
  // to refuse as a wrong password does.
  if (!(await verifyPasswordOrDummy(password, user?.passwordHash)) || !user) {
    recordFailedLogin(ip);
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }
  clearFailedLogins(ip);

  await setSessionCookie(user);

  return NextResponse.json({ id: user.id, username: user.username, role: user.role });
}
