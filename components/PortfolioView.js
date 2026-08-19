'use client';

import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import DiagMarquee from './DiagMarquee';
import Reveal from './Reveal';
import PortfolioVideo from './PortfolioVideo';
import { getVideoEmbed, guessEmbedOrientation } from '@/lib/videoEmbed';
import { UI, pick } from '@/lib/i18n';

const FILTERS = ['All', 'Branding', 'Video', 'Social Media', 'Motion', 'Campaigns'];

const CARD_TINTS = ['var(--orange)', 'var(--gold)', 'var(--green)', 'var(--blue)'];

function matchesFilter(p, filter) {
  return filter === 'All' || p.category === filter;
}

// Embeds can't self-report their real size (cross-origin iframe), so a
// portrait one left on "Auto" is guessed from the URL shape — same logic
// PortfolioVideo itself uses. Direct video files rely on onLoadedMetadata
// client-side instead, which we can't know here — they just don't get the
// width cap; the video tag's own aspect-ratio keeps them reasonable anyway.
function isPortraitProject(p) {
  if (p.orientation && p.orientation !== 'auto') return p.orientation === 'portrait';
  if (!p.video) return false;
  const embed = getVideoEmbed(p.video);
  return embed.kind === 'embed' && guessEmbedOrientation(p.video) === 'portrait';
}

export default function PortfolioView({ projects, settings, clients = [], lang = 'en' }) {
  const t = UI[lang];
  const [activeFilter, setActiveFilter] = useState('All');

  // Preserve the stored array order — that's the order the admin sets with the
  // move up / move down controls, so the first project in the array is the
  // first one shown here.
  const live = projects.filter((p) => p.status === 'live');
  const pool = live.filter((p) => matchesFilter(p, activeFilter));

  // All matching work sits in one shared grid (mixed clients side by side,
  // like the reference) — projects saved with no client fall back server-side
  // to the literal string "Placeholder" (app/api/projects/route.js), which is
  // a human hint for the admin table, not a real name, so it's never shown.
  // The one exception: if every visible project belongs to the same real
  // client, that name gets a big centered banner above the grid instead of
  // being repeated on every card.
  const clientKeys = new Set(
    pool.map((p) => {
      const name = (p.client || '').trim();
      const unassigned = !p.clientId && (!name || name === 'Placeholder');
      return p.clientId || (unassigned ? null : `name:${name}`);
    })
  );
  const soleClientName =
    clientKeys.size === 1 && !clientKeys.has(null) ? (pool[0].client || '').trim() : null;
  const soleClientLogo = soleClientName && pool[0].clientId
    ? clients.find((c) => c.id === pool[0].clientId)?.logo || null
    : null;

  return (
    <div className="site">
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

      <DiagMarquee />

      <section className="marketing-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          {pool.length > 0 ? (
            <>
              {soleClientName ? (
                <Reveal className="portfolio-client-banner">
                  {soleClientLogo ? (
                    <span className="portfolio-client-logo">
                      <img src={soleClientLogo} alt={soleClientName} />
                    </span>
                  ) : null}
                  <h2>{soleClientName}</h2>
                </Reveal>
              ) : null}
              <div className="work-grid">
                {pool.map((p, i) => (
                  <Reveal className={`work-card ${isPortraitProject(p) ? 'is-portrait' : ''}`} key={p.id}>
                    <div className={`work-card-media ${i % 2 === 1 ? 'rail-end' : 'rail-start'}`}>
                      {p.video ? (
                        <PortfolioVideo src={p.video} poster={p.image} label={p.category} orientation={p.orientation} />
                      ) : p.image ? (
                        // Real image: shown at its own natural size (plain
                        // <img>, not a background-image crop box) — the
                        // category label still overlays it, same as before.
                        <div className="work-card-img has-image">
                          <img src={p.image} alt={p.title} className="work-card-img-el" />
                          <span className="label">{p.category}</span>
                        </div>
                      ) : (
                        <div className="work-card-img" style={{ background: CARD_TINTS[i % CARD_TINTS.length] }}>
                          <span className="label">{p.category}</span>
                        </div>
                      )}
                      <div className="work-card-rail" aria-hidden="true">keda</div>
                    </div>
                    <div className="work-card-body">
                      <div className="work-card-title-row">
                        <h3>{p.title}</h3>
                        <span className="work-card-view-btn">{t.viewProject}</span>
                      </div>
                      {p.client && p.client !== 'Placeholder' ? (
                        <div className="meta">{t.showcaseClient} <b>{p.client}</b></div>
                      ) : null}
                      <div className="meta">{t.showcaseWork} <b>{p.work}</b></div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </>
          ) : (
            <p className="portfolio-empty">{t.portfolio.empty}</p>
          )}
        </div>
      </section>

      <Footer settings={settings} lang={lang} />
    </div>
  );
}
