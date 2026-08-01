import { pick } from '@/lib/i18n';

// Phrase repeated per row — duplicated once ([...half, ...half]) so the
// translateX(-50%) loop lands on an identical frame and the scroll never
// visibly "jumps" (unlike the old icon version, exact repetition matters a
// lot more for readable text than for abstract shapes).
const REPEAT = 8;

export default function DiagMarquee({ settings = {}, lang = 'en' }) {
  const line1 = pick(settings?.ctaLine1, lang);
  const line2 = pick(settings?.ctaLine2, lang);
  const phrase = [line1, line2].filter(Boolean).join(' ').trim()
    || (lang === 'ar' ? 'خليها كده.' : "Let's make it keda.");
  const half = Array.from({ length: REPEAT }, () => phrase);
  const full = [...half, ...half];

  return (
    <div className="diag-marquee" aria-hidden="true">
      <div className="diag-row a">
        <div className="track marquee-text-track">
          {full.map((p, i) => <span className="marquee-phrase" key={i}>{p}</span>)}
        </div>
      </div>
      <div className="diag-row b">
        <div className="track marquee-text-track">
          {full.map((p, i) => <span className="marquee-phrase" key={i}>{p}</span>)}
        </div>
      </div>
    </div>
  );
}
