import { BLOCKS } from '@/lib/blocks';
import { UI } from '@/lib/i18n';
import { getVideoEmbed } from '@/lib/videoEmbed';

// Which cards the hero fan shows, and which brand character goes with each of
// their images. Plain functions with no server-only imports, so the data can
// be assembled in app/page.js (where image colours are read — see
// lib/imageSwatch.js) and handed to the client-side fan ready to draw.

// Capped at five: past that the arc stops reading as a fan and the outer
// cards fall off the sides.
export const MAX_CARDS = 5;
// Enough to show the range of a client's work without loading a whole
// portfolio into one card.
const MAX_SLIDES = 6;

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
  // Positions nearest the true middle first. With an even count the middle
  // falls between two cards, so the two clients with the most work take that
  // inner pair rather than one of them being pushed out to an edge.
  const centre = (n - 1) / 2;
  const order = [...Array(n).keys()].sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre) || a - b);
  const placed = new Array(n);
  order.forEach((slot, rank) => (placed[slot] = picked[rank]));
  return placed;
}

// Cards in left-to-right slot order. `slides` are image URLs; faces are
// attached afterwards, once colours are known.
export function buildFanCards(clients = [], projects = [], lang = 'en') {
  const t = UI[lang];
  return arrange(groupWork(projects, clients, t)).map((g) => ({
    key: g.key,
    name: g.name,
    label: g.category ? t.filters?.[g.category] || g.category : '',
    slides: g.slides,
  }));
}

// The brand characters by the accent each is drawn in (hues read from the
// SVGs in public/blocks). An image's dominant hue picks the nearest one, so
// the character on a card matches the picture it's sitting on.
const FACES_BY_HUE = [
  { h: 19, face: BLOCKS[6] }, // tangerine
  { h: 72, face: BLOCKS[0] }, // acid
  { h: 171, face: BLOCKS[8] }, // aqua
  { h: 228, face: BLOCKS[4] }, // cobalt
  { h: 266, face: BLOCKS[2] }, // violet
  { h: 337, face: BLOCKS[1] }, // magenta
];
// Paper-bodied characters for images without a clear colour — a black and
// white shot shouldn't get an arbitrary accent.
const NEUTRAL_FACES = [BLOCKS[3], BLOCKS[7]];
// When an image's colour couldn't be read (host down, timed out, not an
// image), the card still gets a character — just not a matched one.
const FALLBACK_FACES = [BLOCKS[2], BLOCKS[1], BLOCKS[0], BLOCKS[4], BLOCKS[6]];

export function faceFor(swatch, cardIndex) {
  if (!swatch) return FALLBACK_FACES[cardIndex % FALLBACK_FACES.length];
  if (swatch.neutral) return NEUTRAL_FACES[cardIndex % NEUTRAL_FACES.length];
  let best = FACES_BY_HUE[0];
  let bestDistance = Infinity;
  for (const f of FACES_BY_HUE) {
    const raw = Math.abs(f.h - swatch.h);
    const distance = Math.min(raw, 360 - raw);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = f;
    }
  }
  return best.face;
}
