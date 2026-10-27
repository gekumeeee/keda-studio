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
export const PERMISSIONS = ['projects', 'clients', 'messages', 'invoices', 'plans', 'contracts', 'settings', 'reports', 'content'];

export function emptyPermissions() {
  return Object.fromEntries(PERMISSIONS.map((p) => [p, false]));
}

// ---- passwords ----
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `${salt}:${derived.toString('hex')}`;
}
// A stand-in hash for sign-in attempts with a username that doesn't exist:
// checking the password against it costs the same scrypt work as a real
// account, so the response time no longer tells an attacker which usernames
// are real. Made once per server instance, lazily.
let dummyHash = null;
export async function verifyPasswordOrDummy(password, stored) {
  if (stored) return verifyPassword(password, stored);
  if (!dummyHash) dummyHash = await hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, dummyHash);
  return false;
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
// `tv` is the user's token version when the session was made. Changing a
// password (or removing the user) bumps the version on the user record, and
// every session signed with an older one stops working — see
// getSessionUser(). Accounts and sessions from before this existed have no
// version at all, which counts as 0 on both sides, so they keep working.
export function tokenVersion(user) {
  return Number.isInteger(user?.tokenVersion) ? user.tokenVersion : 0;
}
export async function createSessionToken(userId, tv = 0) {
  const payload = JSON.stringify({ userId, tv, exp: Date.now() + SESSION_TTL_MS });
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

// ---- report page passes ----
// /report-template/[id] is opened two ways: in the admin's browser (signed
// in, so the session cookie is enough) and by the PDF export, whose headless
// browser has no cookie. The export hands it a short-lived pass instead: an
// HMAC of the report id and an expiry, signed with the session secret.
const REPORT_PASS_TTL_MS = 5 * 60 * 1000;
export async function createReportPass(reportId) {
  const exp = Date.now() + REPORT_PASS_TTL_MS;
  const sig = await sign(b64url(`report:${reportId}:${exp}`));
  return `${exp}.${sig}`;
}
export async function verifyReportPass(reportId, pass) {
  if (typeof pass !== 'string' || !pass.includes('.')) return false;
  const [expStr, sig] = pass.split('.');
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await sign(b64url(`report:${reportId}:${exp}`));
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
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
  const tv = Number.isInteger(payload.tv) ? payload.tv : 0;
  if (tv !== tokenVersion(user)) return null;
  const { passwordHash, tokenVersion: _tv, ...safe } = user;
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

// ---- sign-in throttling ----
// /api/auth/login is open to anyone, and nothing stopped a script from trying
// passwords as fast as it could. Failed attempts are counted per IP and, past
// the limit, refused until the window passes. In-memory and per instance, the
// same trade-off as lib/spamGuard.js (no paid KV, and no Blob write per
// attempt): it stops a burst against a warm function, which is the realistic
// attack on a site this size. Generous enough that a person mistyping their
// password a few times never hits it.
const LOGIN_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };
const failedLogins = new Map(); // ip -> timestamps of failed attempts

function recentFailures(ip, now) {
  for (const [key, times] of failedLogins) {
    const fresh = times.filter((t) => now - t < LOGIN_LIMIT.windowMs);
    if (fresh.length) failedLogins.set(key, fresh);
    else failedLogins.delete(key);
  }
  return failedLogins.get(ip) || [];
}
export function loginLocked(ip) {
  if (!ip) return false;
  return recentFailures(ip, Date.now()).length >= LOGIN_LIMIT.max;
}
export function recordFailedLogin(ip) {
  if (!ip) return;
  const now = Date.now();
  failedLogins.set(ip, [...recentFailures(ip, now), now]);
}
export function clearFailedLogins(ip) {
  if (ip) failedLogins.delete(ip);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

// Puts a fresh session cookie on the response for this user, at their
// current token version.
export async function setSessionCookie(user) {
  const token = await createSessionToken(user.id, tokenVersion(user));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}
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
