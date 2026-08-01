import { pick } from '@/lib/i18n';

// Duplicated once ([...half, ...half]) so the translateX(-50%) loop lands on
// an identical frame — see DiagMarquee.js for why this matters for text.
const REPEAT = 10;

export default function GlyphStrip({ settings = {}, lang = 'en' }) {
  const line1 = pick(settings?.ctaLine1, lang);
  const line2 = pick(settings?.ctaLine2, lang);
  const phrase = [line1, line2].filter(Boolean).join(' ').trim()
    || (lang === 'ar' ? 'خليها كده.' : "Let's make it keda.");
  const half = Array.from({ length: REPEAT }, () => phrase);
  const full = [...half, ...half];

  return (
    <div className="glyph-strip" aria-hidden="true">
      <div className="track marquee-text-track">
        {full.map((p, i) => <span className="marquee-phrase" key={i}>{p}</span>)}
      </div>
    </div>
  );
}
