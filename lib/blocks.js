// The isometric KEDA character blocks (public/blocks/block-01..10.svg).
// Each one is a face in a different brand accent, drawn in the same isometric
// projection as the logomark — they're brand illustration, not UI colour, so
// they sit directly on the ink ground rather than counting as section accents.
export const BLOCKS = Array.from(
  { length: 10 },
  (_, i) => `/blocks/block-${String(i + 1).padStart(2, '0')}.svg`
);

// Repeats the set until it's at least `min` long, then duplicates the whole
// run once so a translateX(-50%) marquee loop lands on an identical frame.
export function blockTrack(min = 14, offset = 0) {
  const half = [];
  while (half.length < min) half.push(BLOCKS[(half.length + offset) % BLOCKS.length]);
  return [...half, ...half];
}
