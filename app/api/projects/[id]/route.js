import { NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/store';
import { requirePermission } from '@/lib/auth';
import { readBody, badBody, str } from '@/lib/apiInput';

export async function PUT(request, { params }) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const { id } = await params;
  const body = await readBody(request);
  if (!body) return badBody();
  const projects = await getProjects({ fresh: true });
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  projects[idx] = {
    ...projects[idx],
    // title and work can be cleared on purpose — an untitled project shows
    // its picture alone — so an empty string is kept, not read as "no change"
    title: body.title !== undefined ? str(body.title) : projects[idx].title,
    category: str(body.category) || projects[idx].category,
    clientId: body.clientId !== undefined ? str(body.clientId) : (projects[idx].clientId || ''),
    client: str(body.client) || projects[idx].client,
    work: body.work !== undefined ? str(body.work) : projects[idx].work,
    image: body.image !== undefined ? str(body.image) : projects[idx].image,
    video: body.video !== undefined ? str(body.video) : projects[idx].video,
    orientation: ['auto', 'landscape', 'portrait'].includes(body.orientation) ? body.orientation : (projects[idx].orientation || 'auto'),
    // only a status that's actually sent changes it — an edit that leaves it
    // out used to publish a draft
    status: body.status !== undefined ? (body.status === 'draft' ? 'draft' : 'live') : projects[idx].status,
    updated: new Date().toISOString(),
  };
  await saveProjects(projects);
  return NextResponse.json(projects[idx]);
}

export async function DELETE(request, { params }) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const { id } = await params;
  const projects = await getProjects({ fresh: true });
  await saveProjects(projects.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
