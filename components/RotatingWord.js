'use client';

import { useEffect, useState } from 'react';

// The hero's middle line: plain type that cycles through the admin's words,
// each in its own brand colour. All the words sit stacked in one grid cell,
// so the line is as wide as the longest and nothing shifts as they change.
//
// `color` is what the admin picked (a palette token such as var(--acid)).
// It becomes data-c, which site.css maps to a per-theme colour: as chosen on
// the dark ground, and a readable partner on paper. Anything that isn't a
// palette token (a hand-entered colour) is used as it is.
const PALETTE = ['acid', 'magenta', 'aqua', 'tangerine', 'violet', 'cobalt', 'paper'];
const HOLD = 2300;

function colorKey(value) {
  const m = /^var\(--([a-z]+)\)$/.exec(String(value || '').trim());
  return m && PALETTE.includes(m[1]) ? m[1] : null;
}

export default function RotatingWord({ words }) {
  const [{ cur, prev }, setPos] = useState({ cur: 0, prev: -1 });
  const count = words.length;
  const still = count <= 1;

  useEffect(() => {
    if (count <= 1) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const id = setInterval(() => {
      // with motion reduced the first word simply stays
      if (document.hidden || reduced.matches) return;
      setPos((p) => ({ cur: (p.cur + 1) % count, prev: p.cur % count }));
    }, HOLD);
    return () => clearInterval(id);
  }, [count]);

  // the admin's list can shrink while a later index is held here
  const on = cur % Math.max(count, 1);

  return (
    <span className={`rot${still ? ' still' : ''}`}>
      {words.map((w, i) => {
        const key = colorKey(w.color);
        const state = still ? '' : i === on ? ' on' : i === prev ? ' off' : '';
        return (
          <span
            key={i}
            className={`rw${state}`}
            data-c={key || undefined}
            style={key ? undefined : { '--wc': w.color }}
            aria-hidden={i === on ? undefined : true}
          >
            {w.text}
          </span>
        );
      })}
    </span>
  );
}
