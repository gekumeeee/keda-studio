// Data layer with two backends:
//  - Vercel Blob, tried first on every call. This is what actually persists
//    data once deployed on Vercel (requires a Blob store connected to the
//    project — Vercel sets the BLOB_READ_WRITE_TOKEN env var automatically
//    once that's done).
//  - Local JSON files under /data, used as a fallback whenever Vercel Blob
//    isn't available (i.e. local development with `next dev`, where there's
//    no read/write token) so nothing extra is needed to run the project on
//    your own machine.
// We don't rely on an env var to decide which backend to use — that isn't
// reliably set inside the deployed function at runtime. Instead we just try
// Vercel Blob and fall back to the filesystem if it throws (which is what
// it does when there's no token available, e.g. locally).
// Every API route only calls the functions below, so this is the only file
// that needs to know which backend is active.

import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';
import { unstable_cache, revalidateTag } from 'next/cache';
import { put, get } from '@vercel/blob';

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOB_PREFIX = 'studio-data/';

// ---- local filesystem backend (fallback) ----
async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}
async function readFileJson(key, fallback) {
  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${key}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
async function writeFileJson(key, data) {
  await ensureDir();
  await fs.writeFile(path.join(DATA_DIR, `${key}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

// The last successfully-read copy of each bucket, kept in memory for the
// life of this server instance. Purely a safety net for the failure path
// below — it plays no part in normal reads (unstable_cache in cachedGetter
// already handles those) and is never the primary source of truth.
const lastGood = new Map();

// ---- unified read/write: try Vercel Blob, fall back to local files ----
// Both fallbacks are wrapped in their own try/catch: on Vercel's serverless
// functions the filesystem outside /tmp is read-only, so if Blob isn't
// configured yet (no store connected, e.g. right after first deploy) the fs
// fallback would itself throw.
//
// `useCache` is left at its default (on) rather than forced off: Vercel
// Blob's own CDN can then serve a repeat read as a cache hit, which doesn't
// count against the Simple Operations quota at all — a second layer behind
// the app-level cache in cachedGetter, for whatever gets past it.
//
// On total failure (Blob down/over quota AND no local fs data, which is
// exactly what production looks like — there's no /data there, only Blob
// has the real content) this used to fall straight back to an empty
// array/object. That's what actually made the August incident look like
// "everything got deleted": the site wasn't broken, it just couldn't prove
// it had any content and showed nothing rather than erroring. Now the last
// copy this server instance read successfully is served instead — stale
// beats empty. Only reaching for the empty `fallback` if this instance has
// never read that bucket at all (e.g. right after a cold start).
async function readJson(key, fallback) {
  try {
    const pathname = `${BLOB_PREFIX}${key}.json`;
    const result = await get(pathname, { access: 'private' });
    if (!result) return fallback;
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    lastGood.set(key, data);
    return data;
  } catch (err) {
    console.error(`[store] Vercel Blob read failed for "${key}", falling back to fs:`, err);
    try {
      const data = await readFileJson(key, fallback);
      if (data !== fallback) lastGood.set(key, data);
      return data;
    } catch (fsErr) {
      console.error(`[store] fs fallback read also failed for "${key}":`, fsErr);
    }
    if (lastGood.has(key)) {
      console.warn(`[store] serving last known-good in-memory copy of "${key}" after both reads failed`);
      return lastGood.get(key);
    }
    return fallback;
  }
}
async function writeJson(key, data) {
  try {
    const pathname = `${BLOB_PREFIX}${key}.json`;
    await put(pathname, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    lastGood.set(key, data);
  } catch (err) {
    console.error(`[store] Vercel Blob write failed for "${key}", falling back to fs:`, err);
    try {
      await writeFileJson(key, data);
      lastGood.set(key, data);
    } catch (fsErr) {
      console.error(`[store] fs fallback write also failed for "${key}" — data NOT persisted:`, fsErr);
    }
  }
}

// Vercel Blob's free tier caps monthly read operations — the marketing pages
// were reading every bucket fresh from Blob on every single visit (some
// buckets twice, once from generateMetadata and again from the page body),
// with zero reuse across requests. That's what actually exhausted the quota
// and made projects/settings silently fall back to their empty defaults in
// production (Vercel's deployed filesystem has no /data to fall back to —
// only Blob has the real data there).
//
// Two layers fix this:
//  - React's cache() dedupes repeat calls within a single request (e.g. the
//    homepage's two getSettings() calls collapse into one).
//  - next/cache's unstable_cache() dedupes across requests, for CACHE_TTL
//    seconds, server-instance-wide — this is what actually stops repeat
//    visits/crawlers from costing a Blob read each. It's tagged by bucket
//    name so an admin save can invalidate just that bucket immediately via
//    revalidateTag() (see touch() below) instead of waiting out the TTL —
//    admin edits still show up on the live site right away.
// 5 minutes rather than 1: admin saves already invalidate their bucket
// instantly via touch()/revalidateTag() below, so raising this costs zero
// freshness for real edits — it only widens the window that repeat/bot
// traffic reuses between cold reads, which is what actually protects the
// free tier's 10K/month Simple Operations cap under real traffic.
const CACHE_TTL = 300;
function cachedGetter(bucket, fallback) {
  return cache(unstable_cache(() => readJson(bucket, fallback), [bucket], { revalidate: CACHE_TTL, tags: [bucket] }));
}
function touch(bucket) {
  revalidateTag(bucket);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const getProjects = cachedGetter('projects', []);
export async function saveProjects(items) {
  await writeJson('projects', items);
  touch('projects');
}

export const getClients = cachedGetter('clients', []);
export async function saveClients(items) {
  await writeJson('clients', items);
  touch('clients');
}

export const getMessages = cachedGetter('messages', []);
export async function saveMessages(items) {
  await writeJson('messages', items);
  touch('messages');
}

export const getSettings = cachedGetter('settings', {});
export async function saveSettings(obj) {
  await writeJson('settings', obj);
  touch('settings');
}

export const getInvoices = cachedGetter('invoices', []);
export async function saveInvoices(items) {
  await writeJson('invoices', items);
  touch('invoices');
}

export const getPlans = cachedGetter('plans', []);
export async function savePlans(items) {
  await writeJson('plans', items);
  touch('plans');
}

export const getContracts = cachedGetter('contracts', []);
export async function saveContracts(items) {
  await writeJson('contracts', items);
  touch('contracts');
}

// Monthly report clients — deliberately NOT called "clients" (that bucket
// above is the portfolio's client-logo bar, a different entity that happens
// to share the word). A retainer client here carries brand colors, socials
// (for the Phase 3 API layer), a package and a price.
export const getReportClients = cachedGetter('report-clients', []);
export async function saveReportClients(items) {
  await writeJson('report-clients', items);
  touch('report-clients');
}

// One record per (reportClientId, month) — metrics, delivered counts,
// analysis, next-month plan and top posts all live on the same document
// rather than SPEC.md's separate Metric/Deliverable/TopPost tables. That
// split makes sense for a relational schema; for a JSON store it just means
// four round-trips and a join to render one page, for no benefit at this
// scale. Report.id is what /report-template/[id] and the PDF export key off.
export const getReports = cachedGetter('reports', []);
export async function saveReports(items) {
  await writeJson('reports', items);
  touch('reports');
}

// getUsers() runs on every authenticated request (requireUser() calls it via
// getSessionUser()), often several times per admin page load as its various
// panels fire off parallel API calls — caching this cuts admin-side Blob
// reads just as much as the marketing pages. touch('users') on every save
// means a revoked permission or changed password takes effect on the very
// next request, never serving a stale cached grant.
export const getUsers = cachedGetter('users', []);
export async function saveUsers(items) {
  await writeJson('users', items);
  touch('users');
}

// The secret used to sign session cookies. Generated once on first use and
// persisted like everything else — this avoids needing the user to configure
// an extra env var on Vercel just to get login working. Never rewritten after
// that, so it only ever needs the plain per-request dedupe, not a TTL cache.
export const getAuthSecret = cache(async function getAuthSecret() {
  const existing = await readJson('auth-secret', null);
  if (existing) return existing;
  const { randomBytes } = await import('crypto');
  const secret = randomBytes(32).toString('hex');
  await writeJson('auth-secret', secret);
  return secret;
});
