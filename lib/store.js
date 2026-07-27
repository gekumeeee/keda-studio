// Data layer with two backends:
//  - Netlify Blobs, tried first on every call. This is what actually
//    persists data once deployed on Netlify.
//  - Local JSON files under /data, used as a fallback whenever Netlify
//    Blobs isn't available (i.e. local development with `next dev`) so
//    nothing extra is needed to run the project on your own machine.
// We don't rely on an env var to decide which backend to use — that isn't
// reliably set inside the deployed function at runtime. Instead we just try
// Netlify Blobs and fall back to the filesystem if it throws (which is what
// it does when there's no Netlify context available, e.g. locally).
// Every API route only calls the functions below, so this is the only file
// that needs to know which backend is active.

import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOB_STORE_NAME = 'studio-data';

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

// ---- unified read/write: try Netlify Blobs, fall back to local files ----
async function readJson(key, fallback) {
  try {
    const store = getStore(BLOB_STORE_NAME);
    const val = await store.get(key, { type: 'json' });
    return val ?? fallback;
  } catch {
    return readFileJson(key, fallback);
  }
}
async function writeJson(key, data) {
  try {
    const store = getStore(BLOB_STORE_NAME);
    await store.set(key, JSON.stringify(data));
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
export async function saveProjects(list) {
  return writeJson('projects', list);
}

export async function getClients() {
  return readJson('clients', []);
}
export async function saveClients(list) {
  return writeJson('clients', list);
}

export async function getMessages() {
  return readJson('messages', []);
}
export async function saveMessages(list) {
  return writeJson('messages', list);
}

export async function getSettings() {
  return readJson('settings', {});
}
export async function saveSettings(obj) {
  return writeJson('settings', obj);
}
