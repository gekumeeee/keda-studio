import { NextResponse } from 'next/server';
import {
  saveProjects, saveClients, saveMessages, saveSettings, saveInvoices, savePlans,
  saveContracts, saveReportClients, saveReports, saveContent,
} from '@/lib/store';
import { requireOwner } from '@/lib/auth';

// Counterpart to /api/admin/export-data — takes the exact file that route
// produces and writes every bucket in it back to THIS deployment's store.
// Built for moving to a different Vercel account: deploy fresh there, finish
// the normal first-run setup (that's what creates the new owner login — see
// below for why users aren't part of this), then run the backup file through
// this to bring the rest of the content over.
//
// Users are deliberately NOT importable here: export-data strips
// passwordHash from them on the way out, so an imported user record would be
// a login with no usable password. The new deployment's first-run setup
// already makes a fresh owner account; anyone else gets re-added from the
// Users tab same as always.
const IMPORTABLE = {
  projects: saveProjects, clients: saveClients, messages: saveMessages, settings: saveSettings,
  invoices: saveInvoices, plans: savePlans, contracts: saveContracts,
  reportClients: saveReportClients, reports: saveReports, content: saveContent,
};

export async function POST(request) {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'That file isn’t valid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'No recognizable data in that file' }, { status: 400 });
  }

  // Check every bucket's shape before writing any of them: settings is one
  // object, everything else a list. A file with, say, "projects": "x" would
  // otherwise be saved as-is and break every page that lists projects — and
  // stopping halfway would leave the site half-restored.
  for (const key of Object.keys(IMPORTABLE)) {
    if (body[key] === undefined) continue;
    const ok = key === 'settings'
      ? body[key] && typeof body[key] === 'object' && !Array.isArray(body[key])
      : Array.isArray(body[key]);
    if (!ok) {
      return NextResponse.json({ error: `"${key}" in that file isn’t in the expected format — nothing was imported` }, { status: 400 });
    }
  }

  const imported = {};
  for (const [key, saveFn] of Object.entries(IMPORTABLE)) {
    if (body[key] === undefined) continue;
    await saveFn(body[key]);
    imported[key] = Array.isArray(body[key]) ? body[key].length : 1;
  }

  if (Object.keys(imported).length === 0) {
    return NextResponse.json({ error: 'No recognizable data in that file' }, { status: 400 });
  }
  return NextResponse.json({ ok: true, imported });
}
