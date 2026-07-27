import { NextResponse } from 'next/server';
import { getProjects, saveProjects, uid } from '@/lib/store';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.title || !body.title.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }
  const projects = await getProjects();
  const project = {
    id: uid(),
    title: body.title.trim(),
    category: body.category || 'Branding',
    client: (body.client || '').trim() || 'Placeholder',
    work: (body.work || '').trim() || 'Details coming soon',
    image: (body.image || '').trim(),
    video: (body.video || '').trim(),
    status: body.status === 'draft' ? 'draft' : 'live',
    updated: new Date().toISOString(),
  };
  projects.unshift(project);
  await saveProjects(projects);
  return NextResponse.json(project, { status: 201 });
}
