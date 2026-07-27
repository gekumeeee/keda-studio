// Data layer with two backends:
//  - Netlify Blobs, used automatically when running on Netlify (detected via
//    process.env.NETLIFY, which Netlify sets in every build/runtime).
//  - Local JSON files under /data, used for local development (`next dev`)
//    so nothing extra is needed to run the project on your own machine.
// Every API route only calls the functions below, so this is the only file
// that needs to know which backend is active.

import { promises as fs } from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOB_STORE_NAME = 'studio-data';

function onNetlify() {
  return !!process.env.NETLIFY;
}

// ---- local filesystem backend ----
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

// ---- Netlify Blobs backend ----
async function readBlobJson(key, fallback) {
  const store = getStore(BLOB_STORE_NAME);
  const val = await store.get(key, { type: 'json' });
  return val ?? fallback;
}
async function writeBlobJson(key, data) {
  const store = getStore(BLOB_STORE_NAME);
  await store.set(key, JSON.stringify(data));
}

// ---- unified read/write ----
async function readJson(key, fallback) {
  return onNetlify() ? readBlobJson(key, fallback) : readFileJson(key, fallback);
}
async function writeJson(key, data) {
  return onNetlify() ? writeBlobJson(key, data) : writeFileJson(key, data);
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
