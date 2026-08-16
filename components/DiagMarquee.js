import { blockGroup } from '@/lib/blocks';

// Two counter-scrolling diagonal rows of the isometric KEDA blocks. Replaces
// the older repeating "Let's make it keda." text rows — the offset on the
// second row keeps the two lanes from mirroring each other exactly.
// Each row holds two identical groups sliding -100% of their own width, which
// is what keeps the bars full end to end (see lib/blocks.js).
function Row({ className, offset }) {
  const group = blockGroup(offset);
  return (
    <div className={`diag-row ${className}`}>
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

export default function DiagMarquee() {
  return (
    <div className="diag-marquee" aria-hidden="true">
      <Row className="a" offset={0} />
      <Row className="b" offset={5} />
    </div>
  );
}
