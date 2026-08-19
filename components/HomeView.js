'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import GlyphStrip from './GlyphStrip';
import DiagMarquee from './DiagMarquee';
import Floaters from './Floaters';
import Reveal from './Reveal';
import CountUp from './CountUp';
import StatCounter from './StatCounter';
import RotatingWord from './RotatingWord';
import HeroGallery from './HeroGallery';
import GlyphIcon from './GlyphIcon';
import PortfolioVideo from './PortfolioVideo';
import { UI, pick } from '@/lib/i18n';

const FILTERS = ['All', 'Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];
const CAP_CLASSES = ['cc1', 'cc2', 'cc3', 'cc4'];

// Renders a heading where the first line is dim and remaining lines are bold —
// the two-tone stacked "kicker" look. Split on newlines in the admin.
function TwoTone({ text }) {
  const lines = String(text).split('\n');
  return (
    <div className="kicker">
      {lines.map((line, i) => (
        <span key={i}>
          {i === 0 ? line : <b>{line}</b>}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

const PLACEHOLDER_SHOWCASE = {
  en: {
    All: { title: 'Your First Case Study Goes Here', client: 'Placeholder', work: 'Branding, Motion, Social', label: 'Case 01' },
    Branding: { title: 'A Brand Identity Case Study', client: 'Placeholder', work: 'Logo, Guidelines, Naming', label: 'Branding' },
    Video: { title: 'A Brand Film Case Study', client: 'Placeholder', work: 'Concept, Shoot, Edit', label: 'Video' },
    'Social Media': { title: 'A Content System Case Study', client: 'Placeholder', work: 'Templates, Captions, Calendar', label: 'Social' },
    Motion: { title: 'A Motion Design Case Study', client: 'Placeholder', work: 'Logo Animation, Kinetic Type', label: 'Motion' },
    Campaigns: { title: 'A Campaign Case Study', client: 'Placeholder', work: 'Concept, Assets, Rollout', label: 'Campaign' },
  },
  ar: {
    All: { title: 'أول مشروع ليك هيبان هنا', client: 'نموذج', work: 'براندينج، موشن، سوشيال', label: 'مشروع ٠١' },
    Branding: { title: 'مشروع هوية بصرية', client: 'نموذج', work: 'لوجو، دليل، تسمية', label: 'براندينج' },
    Video: { title: 'مشروع فيلم للبراند', client: 'نموذج', work: 'فكرة، تصوير، مونتاج', label: 'فيديو' },
    'Social Media': { title: 'مشروع نظام محتوى', client: 'نموذج', work: 'قوالب، كابشنز، خطة', label: 'سوشيال' },
    Motion: { title: 'مشروع موشن ديزاين', client: 'نموذج', work: 'تحريك لوجو، تايبوجرافي', label: 'موشن' },
    Campaigns: { title: 'مشروع حملة', client: 'نموذج', work: 'فكرة، أصول، إطلاق', label: 'حملة' },
  },
};

function handleMagnetic(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left - r.width / 2;
  const y = e.clientY - r.top - r.height / 2;
  el.style.transform = `translate(${x * 0.28}px, ${y * 0.5}px)`;
}
function resetMagnetic(e) {
  e.currentTarget.style.transform = 'translate(0,0)';
}
function handleCapSpotlight(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--x', `${e.clientX - r.left}px`);
  el.style.setProperty('--y', `${e.clientY - r.top}px`);
}

function getShowcase(filter, projects, lang) {
  const live = projects.filter((p) => p.status === 'live');
  const pool = filter === 'All' ? live : live.filter((p) => p.category === filter);
  if (pool.length === 0) return PLACEHOLDER_SHOWCASE[lang][filter] || PLACEHOLDER_SHOWCASE[lang].All;
  const sorted = [...pool].sort((a, b) => new Date(b.updated) - new Date(a.updated));
  const p = sorted[0];
  return {
    title: p.title,
    client: p.client,
    work: p.work,
    label: p.category,
    image: p.image || '',
    video: p.video || '',
    orientation: p.orientation || 'auto',
  };
}

// glyph shapes used inside the impact circles
const IMPACT_GLYPHS = ['circle', 'triangle', 'square', 'cross', 'eye'];

export default function HomeView({ projects, clients, settings, lang = 'en' }) {
  const t = UI[lang];
  const [activeFilter, setActiveFilter] = useState('All');
  const [shownFilter, setShownFilter] = useState('All');
  const [fading, setFading] = useState(false);

  // Derive the showcase during render so it always reflects the current
  // language (and live projects) — no stale state on a language switch.
  const showcase = getShowcase(shownFilter, projects, lang);

  function selectFilter(filter) {
    setActiveFilter(filter);
    setFading(true);
    setTimeout(() => {
      setShownFilter(filter);
      setFading(false);
    }, 180);
  }

  const liveCount = projects.filter((p) => p.status === 'live').length;
  const heroHeading = pick(settings.heroHeading, lang) || null;
  const heroWords = settings.heroWords.map((w) => ({ text: pick(w.text, lang), color: w.color }));

  // Build the scrolling clients track: fill to a minimum, then duplicate for a
  // seamless loop. Falls back to placeholder names before real clients exist.
  const clientSource =
    clients.length > 0 ? clients : [0, 1, 2, 3].map((i) => ({ id: `ph${i}`, name: t.clientPlaceholder, logo: '' }));
  const clientFilled = [];
  let ci = 0;
  while (clientFilled.length < Math.max(8, clientSource.length)) {
    clientFilled.push(clientSource[ci % clientSource.length]);
    ci++;
  }
  const clientMarquee = [...clientFilled, ...clientFilled];

  return (
    // .site carries the dark monochrome base (paper type on ink) and the
    // accent token set — see globals.css. The admin dashboard deliberately
    // sits outside it and keeps its own separate dark theme.
    <div className="site">
      <Header active="home" settings={settings} lang={lang} />

      <section className="hero">
        <Floaters />
        <div className="wrap hero-grid">
          <Reveal>
            <div className="eyebrow">{pick(settings.heroEyebrow, lang)}</div>
            {heroHeading ? (
              <h1>{heroHeading}</h1>
            ) : (
              <h1 className="hero-rotating">
                <span>{pick(settings.heroLine1, lang)}</span>
                <RotatingWord phrases={heroWords} />
                <span>{pick(settings.heroLine3, lang)}</span>
              </h1>
            )}
            <p>{pick(settings.heroPara, lang)}</p>
            <a href="/contact" className="hero-cta magnetic" onMouseMove={handleMagnetic} onMouseLeave={resetMagnetic}>
              {pick(settings.heroCtaLabel, lang)}
            </a>
          </Reveal>
          <Reveal>
            <HeroGallery projects={projects} lang={lang} />
          </Reveal>
        </div>
      </section>

      <DiagMarquee />

      <section className="marketing-section" id="clients">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="kicker clients-kicker">
              {pick(settings.clientsHeading, lang).split('\n').map((line, i) => (
                <span key={i}>{i === 0 ? line : <b>{line}</b>}{i === 0 && <br />}</span>
              ))}
            </div>
          </Reveal>
          <Reveal className="clients-bar">
            <a href="/contact" className="add">{t.clientsAdd}</a>
            <div className="clients-marquee">
              <div className="clients-track">
                {clientMarquee.map((c, i) => (
                  <div className="client-item" key={i}>
                    {c.logo ? (
                      <img src={c.logo} alt={c.name} draggable={false} onContextMenu={(e) => e.preventDefault()} />
                    ) : (
                      <span>{c.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* services — acid. The heading stays on the ink ground and only the
          card row carries the fill, which is what keeps the page near the
          75/25 ratio instead of flooding a whole screenful with colour. */}
      <section className="marketing-section" id="work">
        <div className="wrap">
          <Reveal className="section-head center-head">
            <div className="eyebrow center-eyebrow">{pick(settings.servicesEyebrow, lang)}</div>
            <h2 className="big-heading">{pick(settings.servicesHeading, lang).replace(/\n/g, ' ')}</h2>
          </Reveal>
        </div>
        <div className="accent-band sec-acid">
          <div className="wrap">
          <div className="cap-grid">
            {settings.services.map((svc, i) => (
              <Reveal
                as="div"
                className={`cap-card ${svc.image ? 'has-image' : CAP_CLASSES[i % CAP_CLASSES.length]}`}
                key={i}
                delay={i * 80}
                onMouseMove={handleCapSpotlight}
              >
                {svc.image && <div className="cap-bg" style={{ backgroundImage: `url(${svc.image})` }} />}
                <div className="cap-content">
                  <div className="top"><h4>{pick(svc.title, lang)}</h4><div className="arrow">↗</div></div>
                  <div>
                    {svc.stat && <StatCounter value={svc.stat} className="cap-stat" />}
                    <p>{pick(svc.desc, lang)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="wrap">
          <Reveal className="section-head center-head">
            <h2 className="big-heading">{pick(settings.workHeading, lang).replace(/\n/g, ' ')}</h2>
          </Reveal>
          <Reveal className="filters center-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
                onClick={() => selectFilter(f)}
              >
                {t.filters[f]}
              </button>
            ))}
          </Reveal>
          <Reveal className="showcase" style={{ opacity: fading ? 0 : 1 }}>
            <div>
              <h3>{showcase.title}</h3>
              {showcase.client && showcase.client !== 'Placeholder' ? (
                <div className="meta">{t.showcaseClient} <b>{showcase.client}</b></div>
              ) : null}
              <div className="meta">{t.showcaseWork} <b>{showcase.work}</b></div>
              <a href="#" className="view-btn">{t.viewProject}</a>
            </div>
            {showcase.video ? (
              <PortfolioVideo src={showcase.video} poster={showcase.image} label={showcase.label} orientation={showcase.orientation} />
            ) : showcase.image ? (
              // A real image: shown at its own natural size (no forced crop,
              // no label/play overlay) — this is the one spot on the site
              // that's a plain <img>, not a background-image box, precisely
              // so it isn't cropped into a fixed frame.
              <div className="video-frame has-image">
                <img src={showcase.image} alt={showcase.title} className="video-frame-img" />
              </div>
            ) : (
              // No image at all yet — the gradient placeholder still needs
              // the label/play cue since there's nothing else to show.
              <div className="video-frame">
                <div className="label">{showcase.label}</div>
                <div className="play"></div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* about — violet; the body copy sits on an ink block inside the band */}
      <section className="marketing-section" id="about">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="eyebrow">{pick(settings.aboutEyebrow, lang)}</div>
            <TwoTone text={pick(settings.aboutHeading, lang)} />
          </Reveal>
        </div>
        <div className="accent-band sec-violet">
          <div className="wrap">
          <Reveal className="about-box">
            <p>{pick(settings.aboutBody, lang)}</p>
            <div className="about-stats">
              <div className="stat">
                <CountUp target={liveCount} />
                <div className="label">{t.statProjects}</div>
              </div>
              <div className="stat">
                <CountUp target={clients.length} />
                <div className="label">{t.statClients}</div>
              </div>
            </div>
          </Reveal>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="impact">
        <div className="wrap">
          <Reveal className="section-head center-head">
            <div className="eyebrow center-eyebrow">{pick(settings.impactEyebrow, lang)}</div>
            <h2 className="big-heading">{pick(settings.impactHeading, lang).replace(/\n/g, ' ')}</h2>
          </Reveal>
          <div className="impact-grid">
            {settings.impact.map((it, i) => (
              <Reveal as="div" className="impact-card" key={i} delay={i * 80}>
                {/* no per-item colour: the impact section stays unaccented, so
                    each icon is a flat ink block rather than four hues */}
                <div className="impact-icon">
                  <GlyphIcon type={IMPACT_GLYPHS[i % IMPACT_GLYPHS.length]} />
                </div>
                <StatCounter value={it.value} className="impact-value" />
                <div className="impact-label">{pick(it.label, lang)}</div>
                <div className="impact-sub">{pick(it.sub, lang)}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA — cobalt, the one accent that carries white text */}
      <section className="big-cta">
        <div className="accent-band sec-cobalt">
          <Reveal className="wrap">
            <h2>
              <span className="line1">{pick(settings.ctaLine1, lang)}</span>
              <span className="line2">{pick(settings.ctaLine2, lang)}</span>
            </h2>
            <a href="/contact" className="cta-btn magnetic" onMouseMove={handleMagnetic} onMouseLeave={resetMagnetic}>
              {pick(settings.ctaButton, lang)}
            </a>
          </Reveal>
        </div>
      </section>

      <GlyphStrip />
      <Footer settings={settings} lang={lang} />
    </div>
  );
}
