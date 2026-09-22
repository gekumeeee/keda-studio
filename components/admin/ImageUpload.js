'use client';

import { useRef, useState } from 'react';

// Pick a photo from the device instead of pasting a link. The picture is
// shrunk in the browser first — Vercel rejects request bodies over 4.5 MB,
// and a phone photo is often 5–10 — then sent to /api/admin/upload-image,
// which stores it in the GitHub repo and hands back its public URL. That URL
// is what `value` holds, so the rest of the form doesn't change at all.

const MAX_EDGE = 2000;

async function shrink(file) {
  // Formats the browser can't decode (HEIC on most desktops) go up as they
  // are; the server decodes those itself.
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
  // toBlob can hand back null, or a PNG on browsers without WebP encoding —
  // whichever is smaller goes up.
  return blob && blob.size < file.size ? blob : file;
}

export default function ImageUpload({ value, onChange, label = 'Upload photo' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // picking the same file again should still fire
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', await shrink(file), file.name);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed — try again.');
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="image-upload">
      {value ? (
        <div className="image-upload-preview">
          <img src={value} alt="" />
        </div>
      ) : null}
      <div className="image-upload-actions">
        <button type="button" className="btn-secondary" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : value ? 'Replace photo' : label}
        </button>
        {value && !busy ? (
          <button type="button" className="btn-secondary image-upload-remove" onClick={() => onChange('')}>
            Remove
          </button>
        ) : null}
      </div>
      {error ? <div className="image-upload-error">{error}</div> : null}
      <input ref={input} type="file" accept="image/*" onChange={handleFile} hidden />
    </div>
  );
}
