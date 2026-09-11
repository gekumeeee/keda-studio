import { BLOCKS } from '@/lib/blocks';
import { UI } from '@/lib/i18n';

// The card fan under the hero headline: one card per client, splayed into an
// arc with the middle card standing tallest.
//
// Only clients with a card design appear — the artwork IS the card, so a
// client without one would render an empty coloured rectangle rather than a
// piece of work. Capped at five: past that the arc stops reading as a fan and
// the outer cards fall off the sides.
const MAX_CARDS = 5;

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

// Each card takes one accent and the face that goes with it. The text colour
// is declared per accent rather than derived: acid and aqua need dark type,
// cobalt and violet need light, and guessing that from the fill is how you end
// up with a name nobody can read. Same pairings the rest of the site uses.
const SKINS = [
  { bg: 'var(--violet)', fg: '#FFFFFF', dim: 'rgba(255,255,255,0.82)', face: BLOCKS[1] },
  { bg: 'var(--magenta)', fg: 'var(--ink)', dim: 'rgba(13,13,13,0.74)', face: BLOCKS[6] },
  { bg: 'var(--acid)', fg: 'var(--ink)', dim: 'rgba(13,13,13,0.74)', face: BLOCKS[3] },
  { bg: 'var(--cobalt)', fg: '#FFFFFF', dim: 'rgba(255,255,255,0.82)', face: BLOCKS[8] },
  { bg: 'var(--tangerine)', fg: 'var(--ink)', dim: 'rgba(13,13,13,0.74)', face: BLOCKS[4] },
];

// A real label beats a made-up one: the client's most recent live project
// tells us what we actually did for them, already translated by the same
// filter labels the portfolio uses.
function workLabel(client, projects, t) {
  const theirs = projects
    .filter((p) => p.status === 'live' && (p.clientId === client.id || p.client === client.name))
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));
  const category = theirs[0]?.category;
  return category ? t.filters?.[category] || category : '';
}

// Hover and focus are handled entirely in CSS (:hover, :focus-visible and
// :has() for dimming the siblings). Driving it from React state meant a
// component that re-rendered five cards on every mouse move and could desync
// from the pointer; the CSS version also survives with JS disabled.
export default function ClientCardFan({ clients = [], projects = [], lang = 'en' }) {
  const t = UI[lang];

  const cards = clients.filter((c) => c.cardImage && c.cardImage.trim()).slice(0, MAX_CARDS);
  if (cards.length === 0) return null;

  // With fewer than five, take the middle slots so the arc stays centred
  // instead of leaning to one side.
  const offset = Math.floor((LAYOUT.length - cards.length) / 2);

  return (
    <div className="card-fan">
      {cards.map((c, i) => {
        const slot = LAYOUT[offset + i];
        const skin = SKINS[i % SKINS.length];
        const label = workLabel(c, projects, t);
        return (
          // The whole card is the link, not just the pill that appears on
          // hover — otherwise the only way in is with a mouse. Focus gets the
          // same lift as hover, so tabbing through reads the same way.
          <a
            key={c.id}
            href="/portfolio"
            className="fan-card"
            style={{
              '--rot': `${slot.rot}deg`,
              '--y': `${slot.y}px`,
              '--x': `${slot.x}%`,
              '--card-bg': skin.bg,
              '--card-fg': skin.fg,
              '--card-dim': skin.dim,
            }}
            aria-label={label ? `${c.name} — ${label}` : c.name}
          >
            {/* Outside .fan-card-inner on purpose: the inner box clips the
                artwork, so a badge inside it could never break the edge.
                Sitting out here it genuinely overhangs the corner. */}
            <img className="fan-card-face" src={skin.face} alt="" aria-hidden="true" draggable={false} />
            <div className="fan-card-inner">
              {/* Name first, artwork second. The fan runs off the bottom of the
                  screen by design, so anything below the artwork would be the
                  part nobody sees — and the client's name is the one thing
                  every card has to show. */}
              <div className="fan-card-meta">
                <div className="fan-card-meta-text">
                  <h3>{c.name}</h3>
                  {label ? <span className="fan-card-label">{label}</span> : null}
                </div>
                <span className="fan-card-arrow" aria-hidden="true">↗</span>
              </div>
              <div className="fan-card-window">
                <img className="fan-card-art" src={c.cardImage} alt="" draggable={false} />
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
