import { blockGroup } from '@/lib/blocks';

// Horizontal scrolling strip of the isometric KEDA blocks. Replaces the older
// repeating "Let's make it keda." text bar — same motion, brand assets instead
// of type. Two identical groups, each sliding -100% of its own width, so the
// bar stays full end to end at every viewport size (see lib/blocks.js).
export default function GlyphStrip() {
  const group = blockGroup(0);

  return (
    <div className="glyph-strip" aria-hidden="true">
      <div className="track block-track">
        {[0, 1].map((g) => (
          <div className="block-group" key={g}>
            {group.map((src, i) => (
              <img className="brand-block" src={src} alt="" key={i} draggable={false} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
