import GlyphIcon from './GlyphIcon';
import { buildGlyphSequence } from '@/lib/glyphs';

export default function GlyphStrip() {
  const sequence = buildGlyphSequence();
  return (
    <div className="glyph-strip" aria-hidden="true">
      <div className="track">
        {sequence.map((type, i) => (
          <GlyphIcon key={i} type={type} />
        ))}
      </div>
    </div>
  );
}
