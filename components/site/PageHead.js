import HeroStage from './HeroStage';
import HeroFaces from './HeroFaces';

// The inner pages' opener: the hero's rings and faces around a two-line
// title, the second line in the theme's first accent.
export default function PageHead({ eyebrow, line1, line2, sub, className = '', children }) {
  return (
    <HeroStage className={`hero page ${className}`.trim()}>
      <div className="hero-in">
        {eyebrow ? <p className="eyebrow rv"><span>{eyebrow}</span></p> : null}
        <div className="hero-type">
          <HeroFaces variant="page" />
          <h1 className="d">
            <span className="ln" style={{ '--i': 0 }}>{line1}</span>
            {line2 ? <span className="ln pg-w" style={{ '--i': 1 }}>{line2}</span> : null}
          </h1>
        </div>
        {sub ? <p className="sub rv" style={{ '--d': '.16s' }}>{sub}</p> : null}
        {children}
      </div>
    </HeroStage>
  );
}

// A heading saved as "Our\nPortfolio" is two lines; one saved on a single
// line is split after its first word, so the page title keeps its shape.
export function splitTitle(text) {
  const t = String(text || '').trim();
  if (t.includes('\n')) {
    const [a, ...rest] = t.split('\n');
    return [a.trim(), rest.join(' ').trim()];
  }
  const i = t.indexOf(' ');
  return i === -1 ? [t, ''] : [t.slice(0, i), t.slice(i + 1)];
}
