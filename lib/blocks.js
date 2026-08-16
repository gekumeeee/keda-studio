// The isometric KEDA character blocks (public/blocks/block-01..10.svg).
// Each one is a face in a different brand accent, drawn in the same isometric
// projection as the logomark — they're brand illustration, not UI colour, so
// they sit directly on the ink ground rather than counting as section accents.
export const BLOCKS = Array.from(
  { length: 10 },
  (_, i) => `/blocks/block-${String(i + 1).padStart(2, '0')}.svg`
);

// One marquee group. The strips render TWO of these and slide both by exactly
// -100% of their own width, so the second lands precisely where the first
// began — seamless, and, unlike a single duplicated track shifted by -50%, it
// cannot leave a bare stretch at the end of a cycle. `min-width:100%` in the
// CSS guarantees a group is never narrower than the bar it fills.
//
// COUNT is what keeps the blocks at their intended spacing rather than
// stretched: at ~75px per block, 32 covers a bar about 2400px wide — the
// 124%-wide row on a ~1935px viewport, so ordinary laptop and 1080p screens
// get the natural rhythm. Wider than that the group hits its min-width and
// justify-content spreads the blocks further apart; airier, but still even,
// and never a hole. Raising this trades DOM nodes (6 bars x 2 groups) for
// density on very wide displays.
const COUNT = 32;

export function blockGroup(offset = 0) {
  return Array.from({ length: COUNT }, (_, i) => BLOCKS[(i + offset) % BLOCKS.length]);
}
