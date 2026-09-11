import { BLOCKS } from '@/lib/blocks';
import { UI } from '@/lib/i18n';
import { getVideoEmbed } from '@/lib/videoEmbed';
import FanSlides from './FanSlides';

// The card fan under the hero headline: one card per client, splayed into an
// arc, each card cycling through that client's project images.
//
// Built from the portfolio itself, so it fills and updates on its own as work
// is added — no per-client artwork to maintain. A client's optional card
// cover (set in the admin) is pinned as the first image. Capped at five: past
// that the arc stops reading as a fan and the outer cards fall off the sides.
const MAX_CARDS = 5;
// Enough to show the range of a client's work without loading a whole
// portfolio into one card.
const MAX_SLIDES = 6;

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

// A project's picture: its own image if it has one, otherwise — for YouTube
// only — the video's thumbnail, which YouTube serves at a public URL. The
// other platforms need an API call for a thumbnail, so video-only projects
// from those are left out rather than shown as a blank.
function projectImage(p) {
  if (p.image && p.image.trim()) return p.image.trim();
  const embed = getVideoEmbed(p.video);
  const yt = embed.kind === 'embed' && embed.embedUrl.match(/youtube\.com\/embed\/([\w-]{11})/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
}

// Groups live work by client the same way the portfolio page does: a linked
// client record first, then a typed client name, and everything else into one
// unassigned group. "Placeholder" is what the API stores when no client was
// given — an admin hint, not a name.
function groupWork(projects, clients, t) {
  const groups = new Map();
  const live = projects
    .filter((p) => p.status === 'live')
    .sort((a, b) => new Date(b.updated) - new Date(a.updated));

  for (const p of live) {
    const name = (p.client || '').trim();
    const record =
      clients.find((c) => c.id === p.clientId) || (name ? clients.find((c) => c.name === name) : null);
    const key = record ? record.id : name && name !== 'Placeholder' ? `name:${name}` : 'unassigned';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: record ? record.name : key === 'unassigned' ? t.nav.portfolio : name,
        cover: record?.cardImage?.trim() || '',
        images: [],
        category: p.category,
      });
    }
    const img = projectImage(p);
    if (img) groups.get(key).images.push(img);
  }

  // A client with a cover but no imaged work yet still earns a card.
  for (const c of clients) {
    if (c.cardImage?.trim() && !groups.has(c.id)) {
      groups.set(c.id, { key: c.id, name: c.name, cover: c.cardImage.trim(), images: [], category: '' });
    }
  }

  return [...groups.values()]
    .map((g) => ({ ...g, slides: [...new Set([g.cover, ...g.images].filter(Boolean))].slice(0, MAX_SLIDES) }))
    .filter((g) => g.slides.length > 0);
}

// Most work in the middle, less toward the edges: the centre card is the one
// that stands tallest and gets seen first. Unassigned work goes last in line —
// it's the portfolio's leftovers, not a client to lead with.
function arrange(groups) {
  const ranked = [...groups].sort(
    (a, b) => (a.key === 'unassigned') - (b.key === 'unassigned') || b.slides.length - a.slides.length
  );
  const picked = ranked.slice(0, MAX_CARDS);
  const n = picked.length;
  const mid = Math.floor((n - 1) / 2);
  const order = [mid];
  for (let d = 1; order.length < n; d++) {
    if (mid - d >= 0) order.push(mid - d);
    if (mid + d < n) order.push(mid + d);
  }
  const placed = new Array(n);
  order.forEach((slot, rank) => (placed[slot] = picked[rank]));
  return placed;
}

// Hover and focus are handled entirely in CSS (:hover, :focus-visible and
// :has() for dimming the siblings); only the image cycling needs JS.
export default function ClientCardFan({ clients = [], projects = [], lang = 'en' }) {
  const t = UI[lang];
  const cards = arrange(groupWork(projects, clients, t));
  if (cards.length === 0) return null;

  // With fewer than five, take the middle slots so the arc stays centred
  // instead of leaning to one side.
  const offset = Math.floor((LAYOUT.length - cards.length) / 2);

  return (
    <div className="card-fan">
      {cards.map((c, i) => {
        const slot = LAYOUT[offset + i];
        const skin = SKINS[i % SKINS.length];
        const label = c.category ? t.filters?.[c.category] || c.category : '';
        return (
          // The whole card is the link, not just the pill that appears on
          // hover — otherwise the only way in is with a mouse. Focus gets the
          // same lift as hover, so tabbing through reads the same way.
          <a
            key={c.key}
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
              <FanSlides slides={c.slides} delay={i * 650} />
            </div>
          </a>
        );
      })}
    </div>
  );
}
