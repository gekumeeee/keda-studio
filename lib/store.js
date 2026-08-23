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

// ---- unified read/write: try Vercel Blob, fall back to local files ----
// Both fallbacks are wrapped in their own try/catch: on Vercel's serverless
// functions the filesystem outside /tmp is read-only, so if Blob isn't
// configured yet (no store connected, e.g. right after first deploy) the fs
// fallback would itself throw — we'd rather degrade to an empty/no-op result
// than crash the whole request with a 500.
async function readJson(key, fallback) {
  try {
    const pathname = `${BLOB_PREFIX}${key}.json`;
    const result = await get(pathname, { access: 'private', useCache: false });
    if (!result) return fallback;
    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  } catch (err) {
    console.error(`[store] Vercel Blob read failed for "${key}", falling back to fs:`, err);
    try {
      return await readFileJson(key, fallback);
    } catch (fsErr) {
      console.error(`[store] fs fallback read also failed for "${key}":`, fsErr);
      return fallback;
    }
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
  } catch (err) {
    console.error(`[store] Vercel Blob write failed for "${key}", falling back to fs:`, err);
    try {
      await writeFileJson(key, data);
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
const CACHE_TTL = 60;
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

// Reusable text snippets (payment terms, revision policy, etc.) insertable
// into Contract terms / Plan items / Invoice section items from the admin.
// Gated by the 'plans' permission rather than a new bucket — see admin/page.js.
export const getClauses = cachedGetter('clauses', []);
export async function saveClauses(items) {
  await writeJson('clauses', items);
  touch('clauses');
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
