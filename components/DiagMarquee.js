import GlyphIcon from './GlyphIcon';
import { buildGlyphSequence } from '@/lib/glyphs';

export default function DiagMarquee() {
  const sequence = buildGlyphSequence();
  return (
    <div className="diag-marquee" aria-hidden="true">
      <div className="diag-row a">
        <div className="track">
          {sequence.map((type, i) => (
            <GlyphIcon key={i} type={type} />
          ))}
        </div>
      </div>
      <div className="diag-row b">
        <div className="track">
          {sequence.map((type, i) => (
            <GlyphIcon key={i} type={type} />
          ))}
        </div>
      </div>
    </div>
  );
}
