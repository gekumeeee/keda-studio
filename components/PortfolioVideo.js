'use client';

import { useState } from 'react';

export default function PortfolioVideo({ src, poster, label, className = '' }) {
  const [orientation, setOrientation] = useState(null);

  function handleLoadedMetadata(e) {
    const v = e.currentTarget;
    setOrientation(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
  }

  return (
    <div className={`portfolio-video-wrap ${orientation ? `orient-${orientation}` : ''} ${className}`}>
      {label ? <div className="label">{label}</div> : null}
      <video
        src={src}
        poster={poster || undefined}
        controls
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
      />
    </div>
  );
}
