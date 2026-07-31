import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/store';
import { getSessionUser, userPermissions } from '@/lib/auth';

export async function GET() {
  const users = await getUsers();
  if (users.length === 0) {
    return NextResponse.json({ needsSetup: true, user: null, permissions: null });
  }
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ needsSetup: false, user: null, permissions: null });
  }
  return NextResponse.json({ needsSetup: false, user, permissions: userPermissions(user) });
}
