'use client';

import { useEffect, useRef, useState } from 'react';

// One hero card's window and its character, cycling through the client's
// project images. Each slide is { src, face }: the face was chosen on the
// server to match that image's colours (lib/cardFan.js), so it changes along
// with the picture.
const HOLD = 3200;

const noMenu = (e) => e.preventDefault();

export default function FanSlides({ slides, delay = 0, tag, tagStyle }) {
  const [index, setIndex] = useState(0);
  // Images that failed to load drop out of the rotation, so a broken link in
  // the admin never turns up as an empty card every few seconds.
  const [failed, setFailed] = useState(() => new Set());
  const ref = useRef(null);

  const list = slides.filter((s) => !failed.has(s.src));
  const count = list.length;

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const tick = () => {
      // someone pointing at (or tabbed onto) this card is looking at it
      const card = ref.current?.closest('.fan-card');
      if (document.hidden || (card && card.matches(':hover, :focus-visible'))) return;
      setIndex((i) => (i + 1) % count);
    };
    // each card starts at its own offset, so the changes ripple across the fan
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

  if (count === 0) return null;

  // Only three images are ever mounted: the one showing, the one it just
  // replaced (kept underneath so the crossfade never shows through), and the
  // next one, which gets a full HOLD to load before it's needed.
  const current = index % count;
  const prev = (current - 1 + count) % count;
  const next = (current + 1) % count;
  const face = list[current].face;

  return (
    <>
      <span className="fan-win" ref={ref}>
        {list.map((s, i) => {
          if (i !== current && i !== prev && i !== next) return null;
          const state = i === current ? 'on' : i === prev && count > 1 ? 'was' : '';
          return (
            <img
              key={s.src}
              className={state || undefined}
              src={s.src}
              alt=""
              // the two outer cards are hidden on phones; lazy keeps their
              // images from downloading there
              loading="lazy"
              decoding="async"
              draggable={false}
              onContextMenu={noMenu}
              onError={() => setFailed((f) => new Set(f).add(s.src))}
            />
          );
        })}
        {tag ? <span className="pill fan-tag" style={tagStyle}>{tag}</span> : null}
      </span>
      {/* keyed by the character, so it only re-mounts when the new picture
          calls for a different one */}
      <img key={face} className="fan-face" src={face} alt="" aria-hidden="true" draggable={false} />
    </>
  );
}
