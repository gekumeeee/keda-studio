import FanSlides from './FanSlides';

// The card fan under the hero headline. Purely presentational: which cards
// show, their images and the character for each image are all worked out in
// app/page.js (see lib/cardFan.js), because matching a character to an
// image's colour means reading the image on the server.
//
// Each card is just the work — no frame, no caption. The client's name stays
// in the link's accessible label so a screen reader still gets it.

// Fixed geometry per slot rather than something computed: an arc wants the
// outer cards rotated further AND dropped further, and the relationship isn't
// linear enough to be worth a formula for five positions.
const LAYOUT = [
  { rot: -15, y: 46, x: -8 },
  { rot: -8, y: 18, x: -4 },
  { rot: 0, y: 0, x: 0 },
  { rot: 8, y: 18, x: 4 },
  { rot: 15, y: 46, x: 8 },
];

// Which LAYOUT slots each card count uses — always symmetric about the
// middle so the arc stays balanced. An odd count keeps the upright centre
// slot; an even count leaves it out and uses the tilted slots either side.
// Taking the first four slots straight through left two cards on one side of
// the upright one and one on the other, and the whole fan leaned.
const SLOTS_FOR = { 1: [2], 2: [1, 3], 3: [1, 2, 3], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4] };

export default function ClientCardFan({ cards = [] }) {
  if (cards.length === 0) return null;

  const slots = SLOTS_FOR[Math.min(cards.length, LAYOUT.length)];

  return (
    <div className="card-fan">
      {cards.map((c, i) => {
        const slotIndex = slots[i];
        const slot = LAYOUT[slotIndex];
        return (
          // The whole card is the link, and focus gets the same lift as hover
          // (all in CSS), so tabbing through reads the same as pointing.
          <a
            key={c.key}
            href="/portfolio"
            className="fan-card"
            // The character hangs off the card's OUTER top corner, away from
            // the middle. Each card is tilted with a transform, which traps
            // the character inside that card's layer — so on the inner corner
            // the overlapping neighbour would paint straight over it.
            data-face={slotIndex < 2 ? 'start' : 'end'}
            style={{
              '--rot': `${slot.rot}deg`,
              '--y': `${slot.y}px`,
              '--x': `${slot.x}%`,
              // centre on top, falling away toward the edges
              '--z': LAYOUT.length - Math.abs(slotIndex - 2),
            }}
            aria-label={c.label ? `${c.name} — ${c.label}` : c.name}
          >
            <FanSlides slides={c.slides} delay={i * 650} />
          </a>
        );
      })}
    </div>
  );
}
