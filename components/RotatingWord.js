'use client';

import { useEffect, useState } from 'react';

// Cycles through phrases, fading between them, each in its own brand accent.
// This is the deliberate exception to the rule that colour never touches type
// — everywhere else on the site accents are flat fills only. Colours come from
// the admin (WORD_COLORS in lib/defaults.js), already normalised through
// resolveWordColor() so pre-palette values don't render as plain white.
export default function RotatingWord({ phrases }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // Keyed off the COUNT, not the array itself. The parent builds this list
  // fresh on every render (it maps the admin's words through pick() for the
  // current language), so depending on the array's identity restarted the
  // timer on every render — leaving overlapping intervals that kept yanking
  // the word back to opacity 0, so it cycled but was never actually visible.
  const count = phrases.length;

  useEffect(() => {
    if (count <= 1) return;
    const HOLD = 2000;
    const FADE = 350;
    let fadeTimer;
    const cycle = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % count);
        setVisible(true);
      }, FADE);
    }, HOLD);
    return () => {
      clearInterval(cycle);
      clearTimeout(fadeTimer);
    };
  }, [count]);

  // Guard the lookup: the word list can shrink from the admin while a higher
  // index is still held in state.
  const current = phrases[index % count] || phrases[0];

  return (
    <span
      className="rotating-word"
      style={{
        color: current.color,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      {current.text}
    </span>
  );
}
