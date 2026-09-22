'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import GlyphStrip from './GlyphStrip';
import DiagMarquee from './DiagMarquee';
import Reveal from './Reveal';
import CountUp from './CountUp';
import StatCounter from './StatCounter';
import RotatingWord from './RotatingWord';
import HeroFaces from './HeroFaces';
import ClientCardFan from './ClientCardFan';
import AccentGlyph from './AccentGlyph';
import GlyphIcon from './GlyphIcon';
import PortfolioVideo from './PortfolioVideo';
import { UI, pick } from '@/lib/i18n';

const FILTERS = ['All', 'Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];
const CAP_CLASSES = ['cc1', 'cc2', 'cc3', 'cc4'];

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

// Every section is introduced the same way: the sentence, then the section's
// own name in a chip beside it. `center` is for the one section whose content
// is a centred grid rather than a row.
function SectionHead({ title, tag, center = false }) {
  return (
    <Reveal className={`head-row${center ? ' is-center' : ''}`}>
      <h2 className="head-title">{String(title).replace(/\n/g, ' ')}</h2>
      {tag ? (
        <span className="head-tag">
          <Sparkle />
          {tag}
        </span>
      ) : null}
    </Reveal>
  );
}

// The four-point burst beside the section name — the same drawn-by-hand
// register as the hero's wave, taking its colour from the text beside it.
function Sparkle() {
  return (
    <svg className="sparkle" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" fill="currentColor" />
    </svg>
  );
}

// glyph shapes used inside the impact circles
const IMPACT_GLYPHS = ['circle', 'triangle', 'square', 'cross', 'eye'];

export default function HomeView({ projects, clients, settings, lang = 'en', fanCards = [] }) {
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
        <div className="wrap hero-stage">
          <Reveal className="hero-stage-inner">
            <div className="eyebrow hero-eyebrow">{pick(settings.heroEyebrow, lang)}</div>
            {/* The faces share a box with the headline so their percentage
                positions track the type as it scales. */}
            <div className="hero-type-wrap">
              <HeroFaces />
              {heroHeading ? (
                <h1 className="hero-type">{heroHeading}</h1>
              ) : (
                <h1 className="hero-type hero-rotating">
                  <span className="hero-line">{pick(settings.heroLine1, lang)}</span>
                  {/* Its own line, centred, so a longer word grows out from
                      the middle instead of shunting the line sideways. */}
                  <span className="hero-line hero-line-rotating">
                    <RotatingWord phrases={heroWords} />
                  </span>
                  <span className="hero-line">{pick(settings.heroLine3, lang)}</span>
                </h1>
              )}
            </div>
            <p className="hero-sub">{pick(settings.heroPara, lang)}</p>
            <a href="/contact" className="hero-cta magnetic" onMouseMove={handleMagnetic} onMouseLeave={resetMagnetic}>
              {pick(settings.heroCtaLabel, lang)}
            </a>
          </Reveal>
          {/* Built in app/page.js, where each image's colours are read so its
              character matches it. Renders nothing when no work has an image. */}
          <ClientCardFan cards={fanCards} />
        </div>
      </section>

      <DiagMarquee />

      <section className="marketing-section" id="clients">
        <div className="wrap">
          <SectionHead title={pick(settings.clientsHeading, lang)} tag={t.clientsTag} />
          <Reveal className="clients-bar">
            <a href="/contact" className="add">{t.clientsAdd}</a>
            {/* a KEDA mark at each end of the row of other people's logos */}
            <AccentGlyph />
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
            <AccentGlyph delay={1200} />
          </Reveal>
        </div>
      </section>

      {/* services — a paper panel rising out of the ink, with a colour lip
          showing above its top edge. The cards inside carry the accents, one
          each, so the section still reads as one paper surface with colour
          placed on it rather than a screenful of fill. */}
      <section className="marketing-section sheet-section services-section" id="work">
        <div className="wrap">
          <div className="sheet">
            <SectionHead title={pick(settings.servicesHeading, lang)} tag={pick(settings.servicesEyebrow, lang)} />
            <div className="cap-grid">
              {settings.services.map((svc, i) => (
                <Reveal
                  as="div"
                  className={`cap-card ${CAP_CLASSES[i % CAP_CLASSES.length]}${svc.image ? ' has-photo' : ''}`}
                  key={i}
                  delay={i * 80}
                  onMouseMove={handleCapSpotlight}
                >
                  {/* framed like a photo taped to the card rather than bled to
                      its edges — the picture is an object sitting on it. */}
                  {svc.image && (
                    <div className="cap-photo">
                      <img src={svc.image} alt="" draggable={false} />
                    </div>
                  )}
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

      {/* selected work — the same paper panel as services, in the other
          accent: one block for what we do, one for what it produced. */}
      <section className="marketing-section sheet-section work-section">
        <div className="wrap">
          <div className="sheet">
            <SectionHead title={pick(settings.workHeading, lang)} tag={pick(settings.workEyebrow, lang)} />
            <Reveal className="filters">
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
              <div className="showcase-copy">
                <h3>{showcase.title}</h3>
                {showcase.client && showcase.client !== 'Placeholder' ? (
                  <div className="meta">{t.showcaseClient} <b>{showcase.client}</b></div>
                ) : null}
                <div className="meta">{t.showcaseWork} <b>{showcase.work}</b></div>
                <a href="/portfolio" className="view-btn">{t.viewProject}</a>
              </div>
              {showcase.video ? (
                <PortfolioVideo src={showcase.video} poster={showcase.image} label={showcase.label} orientation={showcase.orientation} />
              ) : showcase.image ? (
                // A real image: its own proportions are kept (no forced crop),
                // but capped in height so a portrait shot can't stretch the row
                // into a column of empty space beside it.
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
        </div>
      </section>

      {/* about — violet; the body copy sits on an ink block inside the band */}
      <section className="marketing-section" id="about">
        <div className="wrap">
          <SectionHead title={pick(settings.aboutHeading, lang)} tag={pick(settings.aboutEyebrow, lang)} />
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
          <SectionHead title={pick(settings.impactHeading, lang)} tag={pick(settings.impactEyebrow, lang)} />
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
