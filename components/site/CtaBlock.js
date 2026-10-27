import Link from 'next/link';
import { pick, SITE_COPY } from '@/lib/i18n';
import { ArrowIcon } from './Icons';

// The closing magenta block, with the call to action from Site Content.
const FLOATERS = [
  { src: '08', s: { '--w': 'clamp(70px,9vw,140px)', '--x': '4%', '--y': '12%', '--r': '-12deg', '--t': '7s' } },
  { src: '09', s: { '--w': 'clamp(60px,8vw,120px)', '--x': 'calc(100% - 6% - clamp(60px,8vw,120px))', '--y': '10%', '--r': '12deg', '--t': '8s', '--dl': '-2s' } },
  { src: '05', s: { '--w': 'clamp(60px,7vw,110px)', '--x': '7%', '--y': '66%', '--r': '8deg', '--t': '6.6s', '--dl': '-3s' } },
  { src: '01', s: { '--w': 'clamp(70px,9vw,136px)', '--x': 'calc(100% - 4% - clamp(70px,9vw,136px))', '--y': '62%', '--r': '-9deg', '--t': '7.4s', '--dl': '-4s' } },
];

export default function CtaBlock({ settings, lang }) {
  const c = SITE_COPY[lang].cta;
  const email = (settings.contactEmail || '').trim();
  return (
    <section className="inset" id="contact">
      <div className="cta">
        {FLOATERS.map((f) => (
          <div className="hb" style={f.s} key={f.src} aria-hidden="true">
            <img src={`/blocks/block-${f.src}.svg`} alt="" draggable={false} />
          </div>
        ))}
        <span className="eyebrow rv" style={{ position: 'relative', zIndex: 2 }}><i />{c.eyebrow}</span>
        <h2 className="d rv" style={{ '--d': '.06s' }}>
          {pick(settings.ctaLine1, lang)} {pick(settings.ctaLine2, lang)}
        </h2>
        <p className="rv" style={{ '--d': '.12s' }}>{c.lead}</p>
        <div className="cta-act rv" style={{ '--d': '.18s' }}>
          <Link className="btn btn-ink" href="/contact">
            <span>{pick(settings.ctaButton, lang)}</span>
            <ArrowIcon />
          </Link>
          {email ? <a className="mail" href={`mailto:${email}`}>{email}</a> : null}
        </div>
      </div>
    </section>
  );
}
