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
// `float`/`delay` keep the drift out of sync between characters: equal
// timings read as one object moving, not six.
const FACES = [
  { src: BLOCKS[1], top: -2, left: -7, size: 6.4, rot: -13, small: false, float: 7.5, delay: 0 },
  { src: BLOCKS[6], top: -8, left: 92, size: 5.8, rot: 11,  small: true,  float: 8.5, delay: 1.1 },
  { src: BLOCKS[3], top: 38, left: -13, size: 5.6, rot: 9,  small: true,  float: 6.8, delay: 2.0 },
  { src: BLOCKS[8], top: 33, left: 98, size: 6.2, rot: -8,  small: false, float: 9.0, delay: 0.6 },
  { src: BLOCKS[4], top: 76, left: 1,  size: 5.4, rot: 14,  small: true,  float: 8.0, delay: 1.6 },
  { src: BLOCKS[9], top: 71, left: 86, size: 5.8, rot: -7,  small: false, float: 7.2, delay: 2.4 },
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
            // as a custom property, not `width`, so the phone breakpoint can
            // scale the whole set down in CSS without fighting inline styles
            '--w': `clamp(36px, ${f.size}vw, ${Math.round(f.size * 17)}px)`,
            transform: `rotate(${f.rot}deg)`,
            '--float': `${f.float}s`,
            '--delay': `${f.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
