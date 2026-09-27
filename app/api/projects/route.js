import { NextResponse } from 'next/server';
import { getProjects, saveProjects, uid } from '@/lib/store';
import { requirePermission } from '@/lib/auth';

export async function GET() {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(request) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;
  const body = await request.json();
  // Title is optional: a project saved without one shows as the picture on
  // its own on the site, with no caption over it.
  const projects = await getProjects();
  const project = {
    id: uid(),
    title: (body.title || '').trim(),
    category: body.category || 'Branding',
    clientId: (body.clientId || '').trim(),
    client: (body.client || '').trim() || 'Placeholder',
    work: (body.work || '').trim(),
    image: (body.image || '').trim(),
    video: (body.video || '').trim(),
    orientation: ['landscape', 'portrait'].includes(body.orientation) ? body.orientation : 'auto',
    status: body.status === 'draft' ? 'draft' : 'live',
    updated: new Date().toISOString(),
  };
  projects.unshift(project);
  await saveProjects(projects);
  return NextResponse.json(project, { status: 201 });
}
