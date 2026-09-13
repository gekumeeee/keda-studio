'use client';

import { useEffect, useRef, useState } from 'react';

// One hero card's picture and its character, cycling through the client's
// project images. Each slide is { src, face }: the face was chosen on the
// server to match that image's colours (lib/cardFan.js), so it changes along
// with the picture.
const HOLD = 3200;

export default function FanSlides({ slides, delay = 0 }) {
  const [index, setIndex] = useState(0);
  // Images that failed to load drop out of the rotation. A broken link in the
  // admin would otherwise turn up every few seconds as an empty card, and the
  // whole point of the card is the picture.
  const [failed, setFailed] = useState(() => new Set());
  const ref = useRef(null);

  const list = slides.filter((s) => !failed.has(s.src));
  const count = list.length;

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = () => {
      // Someone pointing at (or tabbed onto) this card is looking at it —
      // swapping the picture out from under them is the wrong moment.
      const card = ref.current?.closest('.fan-card');
      if (card && card.matches(':hover, :focus-visible')) return;
      setIndex((i) => (i + 1) % count);
    };

    // Each card starts at its own offset, so the changes ripple across the
    // fan instead of all five changing on the same beat.
    let cycle;
    const start = setTimeout(() => {
      tick();
      cycle = setInterval(tick, HOLD);
    }, HOLD + delay);
    return () => {
      clearTimeout(start);
      clearInterval(cycle);
    };
  }, [count, delay]);

  // Every image failed: render nothing, and the card hides itself (see
  // .fan-card:not(:has(.fan-card-window)) in globals.css).
  if (count === 0) return null;

  // Only three images are ever mounted: the one showing, the one it just
  // replaced (kept underneath so the crossfade never shows through a
  // half-transparent picture), and the next one, which gets a full HOLD to
  // load before it's needed. `current` is clamped because the list can shrink
  // when an image fails.
  const current = index % count;
  const prev = (current - 1 + count) % count;
  const next = (current + 1) % count;
  const face = list[current].face;

  return (
    <>
      {/* Outside the window, which clips, so the character can overhang the
          corner. Keyed by the character itself: it only re-mounts — and
          plays its pop — when the new picture actually calls for a
          different one. */}
      <img key={face} className="fan-card-face" src={face} alt="" aria-hidden="true" draggable={false} />
      <div className="fan-card-window" ref={ref}>
        {list.map((s, i) => {
          if (i !== current && i !== prev && i !== next) return null;
          const state = i === current ? 'is-active' : i === prev ? 'is-prev' : '';
          return (
            <img
              key={s.src}
              className={`fan-card-art ${state}`}
              src={s.src}
              alt=""
              // Costs nothing on a visible card — the hero is in view, so these
              // load straight away — but the two outer cards are display:none on
              // phones, and without this their images would still download.
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => setFailed((prevFailed) => new Set(prevFailed).add(s.src))}
            />
          );
        })}
      </div>
    </>
  );
}
