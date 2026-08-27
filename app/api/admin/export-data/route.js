import { NextResponse } from 'next/server';
import {
  getProjects, getClients, getMessages, getSettings, getInvoices, getPlans,
  getContracts, getClauses, getReportClients, getReports, getUsers,
} from '@/lib/store';
import { requireOwner } from '@/lib/auth';

// Owner-only full backup: every JSON bucket this app keeps, bundled into one
// downloadable file. Exists so the data living in Vercel Blob is never
// something you can only get to through that one Vercel account/project —
// re-importing isn't built yet (nothing needed it before), but having a
// standing export is what makes moving accounts, or just keeping an offline
// copy, possible at all.
//
// Deliberately excludes auth-secret: it's a signing key for THIS
// deployment's session cookies, not user content, and a new deployment
// should mint its own rather than importing an old one.
export async function GET() {
  const gate = await requireOwner();
  if (gate.error) return gate.error;

  const [
    projects, clients, messages, settings, invoices, plans,
    contracts, clauses, reportClients, reports, users,
  ] = await Promise.all([
    getProjects(), getClients(), getMessages(), getSettings(), getInvoices(), getPlans(),
    getContracts(), getClauses(), getReportClients(), getReports(), getUsers(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    projects, clients, messages, settings, invoices, plans,
    contracts, clauses, reportClients, reports,
    // passwordHash stays out of a file that might end up sitting in a
    // Downloads folder — usernames/roles/permissions are still useful to see
    // in a backup, the hash itself isn't something export/import needs.
    users: users.map(({ passwordHash, ...safe }) => safe),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="keda-studio-backup_${date}.json"`,
    },
  });
}
