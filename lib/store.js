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
import { put, list } from '@vercel/blob';

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
async function readJson(key, fallback) {
  try {
    const pathname = `${BLOB_PREFIX}${key}.json`;
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const match = blobs.find((b) => b.pathname === pathname);
    if (!match) return fallback;
    const res = await fetch(match.url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return readFileJson(key, fallback);
  }
}
async function writeJson(key, data) {
  try {
    const pathname = `${BLOB_PREFIX}${key}.json`;
    await put(pathname, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
  } catch {
    await writeFileJson(key, data);
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function getProjects() {
  return readJson('projects', []);
}
export async function saveProjects(items) {
  return writeJson('projects', items);
}

export async function getClients() {
  return readJson('clients', []);
}
export async function saveClients(items) {
  return writeJson('clients', items);
}

export async function getMessages() {
  return readJson('messages', []);
}
export async function saveMessages(items) {
  return writeJson('messages', items);
}

export async function getSettings() {
  return readJson('settings', {});
}
export async function saveSettings(obj) {
  return writeJson('settings', obj);
}
