'use client';

import { BLOCKS } from '@/lib/blocks';

// The brand's block characters scattered across the hero headline, sitting on
// and between the words rather than beside them — the faces read as part of
// the sentence, which is the whole point of the layout.
//
// Positions are percentages of the headline stage, not offsets from any
// particular letter. The headline is admin-editable and swaps between English
// and Arabic (different word lengths, opposite reading direction), so anything
// pinned to a specific glyph would drift the moment the copy changed. Tuned by
// eye against the default copy; they land in the gaps around the type at any
// width instead of on top of a word.
const FACES = [
  { src: BLOCKS[1], top: 2,  left: 4,  size: 5.0, rot: -13, small: false },
  { src: BLOCKS[6], top: -4, left: 86, size: 4.4, rot: 11,  small: true  },
  { src: BLOCKS[3], top: 44, left: -1, size: 4.6, rot: 9,   small: true  },
  { src: BLOCKS[8], top: 40, left: 91, size: 5.0, rot: -8,  small: false },
  { src: BLOCKS[4], top: 78, left: 13, size: 4.2, rot: 14,  small: true  },
  { src: BLOCKS[9], top: 74, left: 79, size: 4.6, rot: -7,  small: false },
];

export default function HeroFaces() {
  return (
    <div className="hero-faces" aria-hidden="true">
      {FACES.map((f, i) => (
        <img
          key={i}
          src={f.src}
          alt=""
          draggable={false}
          className={`hero-face ${f.small ? 'is-small' : ''}`}
          style={{
            top: `${f.top}%`,
            insetInlineStart: `${f.left}%`,
            width: `clamp(34px, ${f.size}vw, ${Math.round(f.size * 16)}px)`,
            transform: `rotate(${f.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}
