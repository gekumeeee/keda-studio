'use client';

import { useEffect, useRef, useState } from 'react';

// The artwork window of one hero card, cycling through that client's project
// images. The only client-side piece of the fan — the cards themselves, their
// hover lift and the dimming of their neighbours are all plain CSS.
const HOLD = 3200;

export default function FanSlides({ slides, delay = 0 }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const count = slides.length;

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

    // Each card starts at its own offset, so the flips ripple across the fan
    // instead of all five changing on the same beat.
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

  // Only three images are ever mounted: the one showing, the one it just
  // replaced (kept underneath so the crossfade never shows the fill through a
  // half-transparent picture), and the next one, which gets a full HOLD to
  // load before it's needed. Mounting every slide would mean five cards times
  // however many projects all downloading at once, above the fold.
  const prev = (index - 1 + count) % count;
  const next = (index + 1) % count;

  return (
    <div className="fan-card-window" ref={ref}>
      {slides.map((s, i) => {
        if (i !== index && i !== prev && i !== next) return null;
        const state = i === index ? 'is-active' : i === prev ? 'is-prev' : '';
        return (
          <img
            key={i}
            className={`fan-card-art ${state}`}
            src={s}
            alt=""
            // Costs nothing on a visible card — the hero is in view, so these
            // load straight away — but the two outer cards are display:none on
            // phones, and without this their images would still download.
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );
      })}
    </div>
  );
}
