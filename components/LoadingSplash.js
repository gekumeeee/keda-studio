'use client';

import { useEffect } from 'react';
import { BLOCKS } from '@/lib/blocks';
import { SPLASH_COOKIE } from '@/lib/site';

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

// Lives in the root layout (app/layout.js), which only renders it on the
// first page of a browser session: the layout checks for the `keda_splash`
// cookie, and this component sets that cookie once it has mounted. A session
// cookie rather than sessionStorage, because the server can read it — so the
// splash is part of the very first HTML, covering the page from the first
// paint, and a returning view gets no splash markup at all. Reading
// sessionStorage instead meant starting hidden and switching on after mount,
// which let the real page flash up for a frame before being covered.
//
// No state here: the fade-out is a CSS animation (splashOut in globals.css)
// that ends at visibility:hidden, and navigation between pages is client-side
// (next/link), so the layout — and this — never remounts mid-session.
export default function LoadingSplash() {
  useEffect(() => {
    document.cookie = `${SPLASH_COOKIE}=1; path=/; SameSite=Lax`;
  }, []);

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
