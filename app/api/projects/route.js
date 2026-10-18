import { NextResponse } from 'next/server';
import { getProjects, saveProjects, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

export async function GET() {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const projects = await getProjects({ fresh: true });
  return NextResponse.json(projects);
}

export async function POST(request) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const body = await readBody(request);
  if (!body) return badBody();
  // Title is optional: a project saved without one shows as the picture on
  // its own on the site, with no caption over it.
  const projects = await getProjects({ fresh: true });
  const project = {
    id: uid(),
    title: str(body.title),
    category: str(body.category) || 'Branding',
    clientId: str(body.clientId),
    client: str(body.client) || 'Placeholder',
    work: str(body.work),
    image: str(body.image),
    video: str(body.video),
    orientation: ['landscape', 'portrait'].includes(body.orientation) ? body.orientation : 'auto',
    status: body.status === 'draft' ? 'draft' : 'live',
    updated: new Date().toISOString(),
  };
  projects.unshift(project);
  await saveProjects(projects);
  return NextResponse.json(project, { status: 201 });
}

// Deletes several projects in one read-modify-write: { ids: [...] }. Sending
// one DELETE per project instead would run that many read-modify-writes side
// by side, and any two landing together each save a list that still has the
// other's project in it.
export async function DELETE(request) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const body = await request.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id) => typeof id === 'string') : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 });
  }
  const remove = new Set(ids);
  const projects = await getProjects({ fresh: true });
  const kept = projects.filter((p) => !remove.has(p.id));
  await saveProjects(kept);
  return NextResponse.json({ ok: true, deleted: projects.length - kept.length });
}
