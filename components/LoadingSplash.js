'use client';

import { useEffect, useState } from 'react';
import { BLOCKS } from '@/lib/blocks';

// A handful of the brand blocks, not the whole set — this is a one-shot
// flourish, not the marquee. Picked for colour variety rather than any
// particular meaning.
const SPLASH_BLOCKS = [BLOCKS[1], BLOCKS[4], BLOCKS[7], BLOCKS[2], BLOCKS[9], BLOCKS[5]];

// Fixed points on a circle (radius ~100px, 60° apart) — precomputed rather
// than done with trig at render time, since there are only ever 6 of these.
// Each block animates FROM its point TO the center, which is what gives the
// "gathering" look; see splashBlockIn in globals.css.
const OFFSETS = [
  [100, 0],
  [50, -87],
  [-50, -87],
  [-100, 0],
  [-50, 87],
  [50, 87],
];

// Lives in the root layout, not any one page — see app/layout.js. Nav links
// in this site (Header.js) are plain <a> tags, not next/link, so every click
// between pages is a full document reload — the layout genuinely remounts
// every time, not just on first open. sessionStorage is what actually limits
// this to once per browser session rather than once per click.
//
// Starts at not-visible (matching the server render, which can't read
// sessionStorage) and only flips on in an effect after mount — the one
// unavoidable trade-off is a single frame where the real page is visible
// before the splash covers it, rather than a hydration mismatch.
export default function LoadingSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('keda-splash-seen')) return;
    sessionStorage.setItem('keda-splash-seen', '1');
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="loading-splash" aria-hidden="true">
      <div className="loading-splash-shapes">
        {SPLASH_BLOCKS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="loading-splash-block"
            style={{ '--i': i, '--x': `${OFFSETS[i][0]}px`, '--y': `${OFFSETS[i][1]}px` }}
          />
        ))}
      </div>
      <img src="/brand/keda-logomark-white.svg" alt="" className="loading-splash-icon" />
    </div>
  );
}
