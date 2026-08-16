'use client';

import { useEffect, useState } from 'react';

// Cycles through phrases, fading between them.
// The per-phrase colour stored in the admin is deliberately NOT applied: the
// brand system keeps colour out of headings entirely (accents are section
// fills only), so the rotating word inherits the hero's ink like the rest of
// the headline. The stored colour is left in the data model so the choice
// survives if a coloured treatment is ever reinstated.
export default function RotatingWord({ phrases }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (phrases.length <= 1) return;
    const HOLD = 2000;
    const FADE = 350;
    let fadeTimer;
    const cycle = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, FADE);
    }, HOLD);
    return () => {
      clearInterval(cycle);
      clearTimeout(fadeTimer);
    };
  }, [phrases]);

  const current = phrases[index];

  return (
    <span
      className="rotating-word"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      {current.text}
    </span>
  );
}
