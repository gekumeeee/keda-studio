import { blockTrack } from '@/lib/blocks';

// Two counter-scrolling diagonal rows of the isometric KEDA blocks. Replaces
// the older repeating "Let's make it keda." text rows — the offset on the
// second row keeps the two lanes from mirroring each other exactly.
export default function DiagMarquee() {
  const rowA = blockTrack(14, 0);
  const rowB = blockTrack(14, 5);

  return (
    <div className="diag-marquee" aria-hidden="true">
      <div className="diag-row a">
        <div className="track block-track">
          {rowA.map((src, i) => (
            <img className="brand-block" src={src} alt="" key={i} draggable={false} />
          ))}
        </div>
      </div>
      <div className="diag-row b">
        <div className="track block-track">
          {rowB.map((src, i) => (
            <img className="brand-block" src={src} alt="" key={i} draggable={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
