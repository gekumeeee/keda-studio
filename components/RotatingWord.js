'use client';

import { useEffect, useState } from 'react';

// Cycles through phrases with a color per phrase, fading between them.
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
        color: current.color,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
      }}
    >
      {current.text}
    </span>
  );
}
