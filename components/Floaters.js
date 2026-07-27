import GlyphIcon from './GlyphIcon';
import { GLYPH_TYPES } from '@/lib/glyphs';

const SPOTS = [
  { top: '10%', left: '6%', size: 22, delay: '0s' },
  { top: '70%', left: '14%', size: 16, delay: '1.2s' },
  { top: '22%', left: '92%', size: 20, delay: '.6s' },
  { top: '80%', left: '88%', size: 14, delay: '1.8s' },
  { top: '45%', left: '48%', size: 18, delay: '.9s' },
];

export default function Floaters() {
  return (
    <div className="floaters" aria-hidden="true">
      {SPOTS.map((s, i) => (
        <GlyphIcon
          key={i}
          type={GLYPH_TYPES[i % GLYPH_TYPES.length]}
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
