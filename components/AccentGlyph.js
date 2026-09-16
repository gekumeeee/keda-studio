'use client';

import { useEffect, useState } from 'react';

// A brand mark that keeps changing: it swaps between the identity's shapes and
// through the six accents, flipping as it goes. One sits at each end of the
// clients row, which is otherwise a flat line of other people's logos — the
// mark is the one piece of KEDA in it.
//
// Solid silhouettes rather than the outlined glyphs (GlyphIcon): those are
// drawn with an ink stroke for light grounds, and this sits on the ink.
const SHAPES = [
  // the four-point burst
  'M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z',
  // a block face stood on its corner
  'M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z',
  // the isometric block, seen straight on
  'M12 1 L21.5 6.5 V17.5 L12 23 L2.5 17.5 V6.5 Z',
  // a single angled face, rising left to right
  'M2 15 L9.5 3 L22 7 L14 20 Z',
];

const ACCENTS = ['var(--acid)', 'var(--magenta)', 'var(--cobalt)', 'var(--tangerine)', 'var(--violet)', 'var(--aqua)'];

const HOLD = 2400;

export default function AccentGlyph({ delay = 0 }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // The two marks are offset from each other, so the row never blinks as a
    // pair — one changes, then the other.
    let cycle;
    const start = setTimeout(() => {
      setStep((s) => s + 1);
      cycle = setInterval(() => setStep((s) => s + 1), HOLD);
    }, HOLD + delay);
    return () => {
      clearTimeout(start);
      clearInterval(cycle);
    };
  }, [delay]);

  // Shapes and colours are stepped by counts that share no factor, so the
  // pairing of the two keeps changing rather than repeating every four swaps.
  return (
    <svg
      className="accent-glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ color: ACCENTS[step % ACCENTS.length] }}
    >
      {/* keyed by the step so each swap re-mounts the group and replays the
          flip; the colour on the <svg> transitions instead, so it slides from
          one accent to the next while the shape turns. */}
      <g key={step}>
        <path d={SHAPES[step % SHAPES.length]} fill="currentColor" />
      </g>
    </svg>
  );
}
