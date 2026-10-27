import StatCounter from '../StatCounter';
import { pick } from '@/lib/i18n';

// "Our impact": the admin's numbers as colour cards, each counting up as it
// comes into view.
//
// Card colours follow the approved design's order (violet, cobalt,
// tangerine, aqua) unless the admin picked one of the current palette's
// accents for a number. The colour names saved before the palette change
// (green, orange, blue, gold — still the stored defaults) count as "not
// picked", so existing content gets the design's colours.
const ORDER = ['violet', 'cobalt', 'tangerine', 'aqua'];
const ACCENTS = ['acid', 'magenta', 'cobalt', 'tangerine', 'violet', 'aqua'];
const DARK_GROUND = ['violet', 'cobalt'];
const BLOCKS = [['08', '16deg'], ['02', '-12deg'], ['03', '14deg'], ['05', '-10deg']];

function cardColor(value, i) {
  const m = /^var\(--([a-z]+)\)$/.exec(String(value || '').trim());
  return m && ACCENTS.includes(m[1]) ? m[1] : ORDER[i % ORDER.length];
}

export default function ImpactStats({ settings, lang, padTop = true }) {
  return (
    <section className="sec" id="impact" style={padTop ? undefined : { paddingTop: 0 }}>
      <div className="wrap">
        <div className="impact-head rv">
          <span className="eyebrow"><i />{pick(settings.impactEyebrow, lang)}</span>
          <h2 className="d">{pick(settings.impactHeading, lang).replace(/\n/g, ' ')}</h2>
        </div>
        <div className="stats">
          {settings.impact.map((it, i) => {
            const c = cardColor(it.color, i);
            const [block, rot] = BLOCKS[i % BLOCKS.length];
            return (
              <article
                className="st rv"
                key={i}
                style={{ '--c': `var(--${c})`, '--fg': DARK_GROUND.includes(c) ? 'var(--paper)' : 'var(--ink)', '--d': `${0.04 + i * 0.06}s` }}
              >
                <img src={`/blocks/block-${block}.svg`} alt="" style={{ '--r': rot }} draggable={false} />
                <StatCounter value={it.value} className="num" duration={1700} />
                <h3>{pick(it.label, lang)}</h3>
                {pick(it.sub, lang) ? <p>{pick(it.sub, lang)}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
