'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DiagMarquee from './DiagMarquee';
import Reveal from './Reveal';
import { UI, pick } from '@/lib/i18n';

const FILTERS = ['All', 'Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];

const PLACEHOLDER_SHOWCASE = {
  en: { title: 'Your First Case Study Goes Here', client: 'Placeholder', work: 'Branding, Motion, Social', label: 'Case 01' },
  ar: { title: 'أول مشروع ليك هيبان هنا', client: 'نموذج', work: 'براندينج، موشن، سوشيال', label: 'مشروع ٠١' },
};

const CARD_TINTS = ['var(--orange)', 'var(--gold)', 'var(--green)', 'var(--blue)'];

function matchesFilter(p, filter) {
  return filter === 'All' || p.category === filter;
}

export default function PortfolioView({ projects, settings, lang = 'en' }) {
  const t = UI[lang];
  const [activeFilter, setActiveFilter] = useState('All');

  const live = projects.filter((p) => p.status === 'live');
  const pool = live.filter((p) => matchesFilter(p, activeFilter)).sort((a, b) => new Date(b.updated) - new Date(a.updated));
  const featured = pool[0] || null;
  const rest = pool.slice(1);

  const showcase = featured
    ? { title: featured.title, client: featured.client, work: featured.work, label: featured.category, image: featured.image || '' }
    : PLACEHOLDER_SHOWCASE[lang];

  return (
    <>
      <Header active="portfolio" settings={settings} lang={lang} />

      <section className="marketing-section" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Reveal className="section-head center-head">
            <div className="eyebrow center-eyebrow">{pick(settings.portfolioEyebrow, lang)}</div>
            <div className="big-heading two-tone-center">
              {pick(settings.portfolioHeading, lang).split('\n').map((line, i) => (
                <span key={i}>{i === 0 ? line : <b>{line}</b>}{i === 0 ? ' ' : ''}</span>
              ))}
            </div>
          </Reveal>
          <Reveal className="filters center-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {t.filters[f]}
              </button>
            ))}
          </Reveal>
          <Reveal className="showcase">
            <div>
              <h3>{showcase.title}</h3>
              <div className="meta">{t.showcaseClient} <b>{showcase.client}</b></div>
              <div className="meta">{t.showcaseWork} <b>{showcase.work}</b></div>
            </div>
            <div className={`video-frame ${showcase.image ? 'has-image' : ''}`} style={showcase.image ? { backgroundImage: `url(${showcase.image})` } : undefined}>
              <div className="label">{showcase.label}</div>
              <div className="play"></div>
            </div>
          </Reveal>
        </div>
      </section>

      <DiagMarquee />

      <section className="marketing-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {rest.length > 0 ? (
            <Reveal className="portfolio-grid">
              {rest.map((p, i) => (
                <div className="portfolio-card" key={p.id}>
                  {p.image ? (
                    <div className="portfolio-card-img" style={{ backgroundImage: `url(${p.image})` }} />
                  ) : (
                    <div className="portfolio-card-img" style={{ background: CARD_TINTS[i % CARD_TINTS.length] }} />
                  )}
                  <div className="portfolio-card-body">
                    <span className="portfolio-card-cat">{p.category}</span>
                    <h4>{p.title}</h4>
                    <span className="portfolio-card-client">{p.client}</span>
                  </div>
                </div>
              ))}
            </Reveal>
          ) : (
            !featured && <p className="portfolio-empty">{t.portfolio.empty}</p>
          )}
        </div>
      </section>

      <Footer settings={settings} lang={lang} />
    </>
  );
}
