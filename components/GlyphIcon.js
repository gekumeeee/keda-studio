export default function GlyphIcon({ type, style }) {
  const stroke = '#0A0A0A';
  const paths = {
    // isometric box — hexagon outline + 3 spokes to the center, the classic 3D-block glyph
    cube: <path d="M9 2 L15 5.5 L15 12.5 L9 16 L3 12.5 L3 5.5 Z M9 2 V9 M9 9 L15 12.5 M9 9 L3 12.5" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />,
    // a single angled block face, rising left-to-right
    facetTop: <path d="M2 12 L8 3 L16 6 L10 15 Z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />,
    // the mirrored block face, rising right-to-left
    facetSide: <path d="M2 6 L10 3 L16 12 L8 15 Z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />,
    // two blocks stacked on a rising diagonal
    stack: <path d="M7 9 L11 13 L7 17 L3 13 Z M11 3 L15 7 L11 11 L7 7 Z" fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />,
    // a single rotated block face
    diamond: <path d="M9 2 L16 9 L9 16 L2 9 Z" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />,
  };
  return (
    <svg viewBox="0 0 18 18" style={style}>
      {paths[type] || paths.cube}
    </svg>
  );
}
