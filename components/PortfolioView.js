'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DiagMarquee from './DiagMarquee';
import Reveal from './Reveal';
import PortfolioVideo from './PortfolioVideo';
import { UI, pick } from '@/lib/i18n';

const FILTERS = ['All', 'Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];

const CARD_TINTS = ['var(--orange)', 'var(--gold)', 'var(--green)', 'var(--blue)'];

function matchesFilter(p, filter) {
  return filter === 'All' || p.category === filter;
}

export default function PortfolioView({ projects, settings, lang = 'en' }) {
  const t = UI[lang];
  const [activeFilter, setActiveFilter] = useState('All');

  // Preserve the stored array order — that's the order the admin sets with the
  // move up / move down controls, so the first project in the array is the
  // first one shown here.
  const live = projects.filter((p) => p.status === 'live');
  const pool = live.filter((p) => matchesFilter(p, activeFilter));

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
        </div>
      </section>

      <DiagMarquee settings={settings} lang={lang} />

      <section className="marketing-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {pool.length > 0 ? (
            <div className="work-rows">
              {pool.map((p, i) => (
                <Reveal className={`work-row ${i % 2 === 1 ? 'flip' : ''}`} key={p.id}>
                  <div className="work-row-text">
                    <span className="work-row-cat">{p.category}</span>
                    <h3>{p.title}</h3>
                    <div className="meta">{t.showcaseClient} <b>{p.client}</b></div>
                    <div className="meta">{t.showcaseWork} <b>{p.work}</b></div>
                  </div>
                  <div className="work-row-media">
                    {p.video ? (
                      <PortfolioVideo src={p.video} poster={p.image} label={p.category} />
                    ) : p.image ? (
                      <div className="work-row-img" style={{ backgroundImage: `url(${p.image})` }}>
                        <span className="label">{p.category}</span>
                      </div>
                    ) : (
                      <div className="work-row-img" style={{ background: CARD_TINTS[i % CARD_TINTS.length] }}>
                        <span className="label">{p.category}</span>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="portfolio-empty">{t.portfolio.empty}</p>
          )}
        </div>
      </section>

      <Footer settings={settings} lang={lang} />
    </>
  );
}
