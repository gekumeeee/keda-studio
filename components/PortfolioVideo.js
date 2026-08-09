'use client';

import { useState } from 'react';
import { getVideoEmbed, guessEmbedOrientation } from '@/lib/videoEmbed';

export default function PortfolioVideo({ src, poster, label, orientation = 'auto', className = '' }) {
  const [detected, setDetected] = useState(null);
  const embed = getVideoEmbed(src);

  function handleLoadedMetadata(e) {
    const v = e.currentTarget;
    setDetected(v.videoHeight > v.videoWidth ? 'portrait' : 'landscape');
  }

  // Explicit admin choice wins; otherwise fall back to metadata (for real
  // files, where we can measure it) or a URL-shape guess (for embeds, whose
  // dimensions we can't read from inside a cross-origin iframe — reels/shorts
  // links guess portrait, everything else guesses landscape).
  const resolved =
    orientation && orientation !== 'auto'
      ? orientation
      : detected || (embed.kind === 'embed' ? guessEmbedOrientation(src) : null);

  const wrapCls = `portfolio-video-wrap ${resolved ? `orient-${resolved}` : ''} ${embed.kind === 'embed' ? 'is-embed' : ''} ${className}`.trim();

  if (embed.kind === 'embed') {
    return (
      <div className={wrapCls}>
        {label ? <div className="label">{label}</div> : null}
        <iframe
          src={embed.embedUrl}
          title={label || 'Project video'}
          allow="autoplay; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          loading="lazy"
          scrolling="no"
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <div className={wrapCls}>
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
