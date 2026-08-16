import { blockTrack } from '@/lib/blocks';

// Horizontal scrolling strip of the isometric KEDA blocks. Replaces the older
// repeating "Let's make it keda." text bar — same motion, brand assets instead
// of type. Duplicated once inside blockTrack() so the loop is seamless.
export default function GlyphStrip() {
  const track = blockTrack(16);

  return (
    <div className="glyph-strip" aria-hidden="true">
      <div className="track block-track">
        {track.map((src, i) => (
          <img className="brand-block" src={src} alt="" key={i} draggable={false} />
        ))}
      </div>
    </div>
  );
}
