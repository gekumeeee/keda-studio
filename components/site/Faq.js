'use client';

import { useState } from 'react';
import { PlusIcon } from './Icons';

// One question open at a time; the first starts open.
export default function Faq({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="rv" style={{ '--d': '.1s' }}>
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div className="qa" data-open={isOpen} key={i}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-a-${i}`}
              id={`faq-q-${i}`}
              onClick={() => setOpen(isOpen ? -1 : i)}
            >
              <span>{it.q}</span>
              <span className="pl"><PlusIcon /></span>
            </button>
            <div className="a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
              <div><p>{it.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
