import Link from 'next/link';
import FanSlides from './FanSlides';

// The fan of real work rising out of the bottom of the hero: one card per
// client, each cycling that client's images and opening their gallery on the
// portfolio page. Which cards show, their images and the character for each
// image are all worked out in app/(site)/page.js (see lib/cardFan.js).

// Fixed geometry per slot: an arc wants the outer cards rotated further AND
// dropped further, and five positions aren't worth a formula.
const LAYOUT = [
  { rot: -15, y: 46, x: -8 },
  { rot: -8, y: 18, x: -4 },
  { rot: 0, y: 0, x: 0 },
  { rot: 8, y: 18, x: 4 },
  { rot: 15, y: 46, x: 8 },
];
// The slot colours of the client name pill, as in the approved design.
const TAGS = [
  { '--c': 'var(--aqua)' },
  { '--c': 'var(--tangerine)' },
  { '--c': 'var(--acid)' },
  { '--c': 'var(--magenta)' },
  { '--c': 'var(--violet)', color: 'var(--paper)' },
];

// Which slots each card count uses, always symmetric about the middle so the
// arc stays balanced.
const SLOTS_FOR = { 1: [2], 2: [1, 3], 3: [1, 2, 3], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };

export default function ClientCardFan({ cards = [] }) {
  if (cards.length === 0) return null;
  const slots = SLOTS_FOR[Math.min(cards.length, LAYOUT.length)];

  return (
    <div className="fan">
      {cards.map((c, i) => {
        const slotIndex = slots[i];
        const slot = LAYOUT[slotIndex];
        return (
          <Link
            key={c.key}
            href={c.href}
            className="fan-card"
            // the character hangs off the card's OUTER top corner, away from
            // the middle, where no neighbour paints over it
            data-face={slotIndex < 2 ? 'start' : 'end'}
            style={{
              '--rot': `${slot.rot}deg`,
              '--y': `${slot.y}px`,
              '--x': `${slot.x}%`,
              '--z': LAYOUT.length - Math.abs(slotIndex - 2),
              '--k': i,
            }}
            aria-label={c.name}
          >
            <FanSlides slides={c.slides} delay={i * 650} tag={c.name} tagStyle={TAGS[slotIndex]} />
          </Link>
        );
      })}
    </div>
  );
}
