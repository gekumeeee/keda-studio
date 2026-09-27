'use client';

import { useRef, useState } from 'react';
import { uploadPhoto } from './ImageUpload';

// Pick many photos at once for one client. Each is uploaded in turn and handed
// to `onUploaded(url)`, which saves it as a project of its own (untitled —
// the photo alone). One at a time rather than all together: GitHub rejects
// commits racing on the same branch, and a progress count is clearer anyway.
export default function BulkPhotoUpload({ onUploaded, label = 'Upload photos' }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null); // { done, total }
  const [errors, setErrors] = useState([]);

  async function handleFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (files.length === 0) return;
    setErrors([]);
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      try {
        await onUploaded(await uploadPhoto(files[i]));
      } catch (err) {
        failed.push(`${files[i].name}: ${err.message || 'upload failed'}`);
      }
    }
    setProgress(null);
    setErrors(failed);
  }

  return (
    <div className="bulk-upload">
      <button type="button" className="add-btn" onClick={() => input.current?.click()} disabled={!!progress}>
        {progress ? `Uploading ${progress.done + 1} / ${progress.total}…` : label}
      </button>
      <input ref={input} type="file" accept="image/*" multiple onChange={handleFiles} hidden />
      {errors.length ? (
        <div className="image-upload-error">
          {errors.length} photo{errors.length === 1 ? '' : 's'} didn&apos;t upload — {errors.join(' · ')}
        </div>
      ) : null}
    </div>
  );
}
