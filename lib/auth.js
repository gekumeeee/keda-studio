// Real auth for /admin: users are stored via lib/store.js (same Blob/fs
// backend as everything else — there's no traditional database here).
// Passwords are hashed with Node's built-in scrypt (no extra dependency,
// no native binary to worry about on Vercel, unlike bcrypt). Sessions are a
// stateless HMAC-signed cookie (payload + signature, both base64url) rather
// than a server-side session table, verified against a secret that's
// generated once and persisted the same way as everything else.

import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHmac } from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getUsers, getAuthSecret } from '@/lib/store';

const scrypt = promisify(scryptCb);
const SESSION_COOKIE = 'keda_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Every permission-gated section of the admin. "owner" role always has all
// of these regardless of what's stored on the user record.
export const PERMISSIONS = ['projects', 'clients', 'messages', 'invoices', 'plans', 'settings'];

export function emptyPermissions() {
  return Object.fromEntries(PERMISSIONS.map((p) => [p, false]));
}

// ---- passwords ----
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const derived = await scrypt(password, salt, 64);
  const stored_ = Buffer.from(hashHex, 'hex');
  if (stored_.length !== derived.length) return false;
  return timingSafeEqual(derived, stored_);
}

// ---- session tokens ----
function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}
async function sign(payloadB64) {
  const secret = await getAuthSecret();
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}
export async function createSessionToken(userId) {
  const payload = JSON.stringify({ userId, exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = b64url(payload);
  const sig = await sign(payloadB64);
  return `${payloadB64}.${sig}`;
}
export async function verifySessionToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.');
  const expectedSig = await sign(payloadB64);
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- request-level helpers ----
// Returns the logged-in user (without passwordHash) or null. Safe to call
// from any route handler / server component — reads the cookie jar itself.
export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const users = await getUsers();
  const user = users.find((u) => u.id === payload.userId);
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function userPermissions(user) {
  if (!user) return emptyPermissions();
  if (user.role === 'owner') return Object.fromEntries(PERMISSIONS.map((p) => [p, true]));
  return { ...emptyPermissions(), ...(user.permissions || {}) };
}

export function hasPermission(user, section) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return !!user.permissions?.[section];
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

// ---- route guards ----
// Use at the top of any protected API route:
//   const gate = await requireUser(); if (gate.error) return gate.error;
//   const { user } = gate;
const UNAUTHORIZED = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const FORBIDDEN = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 });

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { user: null, error: UNAUTHORIZED() };
  return { user, error: null };
}
export async function requirePermission(section) {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (!hasPermission(user, section)) return { user: null, error: FORBIDDEN() };
  return { user, error: null };
}
export async function requireOwner() {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (user.role !== 'owner') return { user: null, error: FORBIDDEN() };
  return { user, error: null };
}
