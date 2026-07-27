import { NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/store';

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const projects = await getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  projects[idx] = {
    ...projects[idx],
    title: body.title?.trim() || projects[idx].title,
    category: body.category || projects[idx].category,
    client: body.client?.trim() || projects[idx].client,
    work: body.work?.trim() || projects[idx].work,
    image: body.image !== undefined ? body.image.trim() : projects[idx].image,
    video: body.video !== undefined ? body.video.trim() : projects[idx].video,
    status: body.status === 'draft' ? 'draft' : 'live',
    updated: new Date().toISOString(),
  };
  await saveProjects(projects);
  return NextResponse.json(projects[idx]);
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const projects = await getProjects();
  await saveProjects(projects.filter((p) => p.id !== id));
  return NextResponse.json({ ok: true });
}
