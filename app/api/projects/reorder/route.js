import { NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/store';

// Reorder the stored projects array to match the given list of ids.
// The array order is the source of truth for how projects appear on the
// /portfolio page (and the hero gallery), so this is what the admin's
// move-up / move-down controls call.
export async function POST(request) {
  const body = await request.json();
  const ids = Array.isArray(body?.ids) ? body.ids : null;
  if (!ids) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }
  const projects = await getProjects();
  const byId = new Map(projects.map((p) => [p.id, p]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
  // Safety: append any stored projects that weren't in the incoming list so
  // nothing silently disappears if the client sent a stale set of ids.
  for (const p of projects) {
    if (!ids.includes(p.id)) ordered.push(p);
  }
  await saveProjects(ordered);
  return NextResponse.json({ ok: true, count: ordered.length });
}
