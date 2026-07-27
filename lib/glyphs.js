// Isometric block motif, echoing KEDA's angular-block logomark
// (an original glyph set drawn for this site — not traced from the logo file).
export const GLYPH_TYPES = ['cube', 'facetTop', 'facetSide', 'stack', 'diamond'];

export function buildGlyphSequence(rows = 2, perRow = 14) {
  const sequence = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < perRow; j++) {
      sequence.push(GLYPH_TYPES[(j + i * 7) % GLYPH_TYPES.length]);
    }
  }
  return sequence;
}
