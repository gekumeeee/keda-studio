import { blockGroup } from '@/lib/blocks';

// The moving strip of the KEDA block characters, pulled up over the bottom
// of the hero: a paper bar on the dark theme, an ink bar on the light one.
// Two identical groups, each sliding its own width, so the bar is never
// left bare at any screen size (see lib/blocks.js).
export default function BlockStrip() {
  const group = blockGroup(5);
  return (
    <div className="strips" aria-hidden="true">
      <div className="strip b">
        <div className="strip-track">
          {[0, 1].map((g) => (
            <div className="strip-group" key={g}>
              {group.map((src, i) => (
                <img src={src} alt="" key={i} draggable={false} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
