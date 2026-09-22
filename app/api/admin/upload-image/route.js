import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { mediaUploadsConfigured, uploadImage } from '@/lib/githubMedia';

// Takes one image from the admin, normalises it, and stores it in the GitHub
// repo (see lib/githubMedia.js). Answers { url }.
//
// The browser already shrinks the photo before sending it (Vercel refuses
// request bodies over 4.5 MB), but it's re-encoded here regardless: that's
// what guarantees the stored file is a real image of sane size, with the
// camera's EXIF rotation applied and its metadata (GPS included) stripped
// before it lands in a public repo.

export const runtime = 'nodejs';

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2000;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'];

export async function POST(request) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;

  if (!mediaUploadsConfigured()) {
    return NextResponse.json(
      { error: "Photo uploads aren't set up on this deployment yet — GITHUB_TOKEN is missing." },
      { status: 503 }
    );
  }

  let file;
  try {
    file = (await request.formData()).get('file');
  } catch {
    return NextResponse.json({ error: 'Send the photo as form data under "file".' }, { status: 400 });
  }
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No photo received.' }, { status: 400 });
  }
  if (file.type && !ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'That file type isn’t an image we can use.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That photo is too large — keep it under 4 MB.' }, { status: 413 });
  }

  let out;
  try {
    const { default: sharp } = await import('sharp');
    out = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: 'error' })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'That file couldn’t be read as an image.' }, { status: 422 });
  }

  try {
    const url = await uploadImage(out, 'webp');
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error('[upload-image]', err);
    return NextResponse.json({ error: 'Saving the photo to GitHub failed — try again.' }, { status: 502 });
  }
}
