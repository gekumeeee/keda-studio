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

// Each strip repeats its client's items until there's enough of them to read
// as a full, dense row rather than 2-3 cards floating in empty space — same
// reasoning as lib/blocks.js's fixed COUNT for the brand-block marquee, just
// data-driven here since a client's project count varies. Doubles at minimum
// (matching the two-copy loop below), more for a client with very few pieces.
function fillGroup(items) {
  if (items.length === 0) return [];
  const reps = Math.max(2, Math.ceil(8 / items.length));
  return Array.from({ length: reps }, () => items).flat();
}

export default function PortfolioView({ projects, settings, clients = [], lang = 'en' }) {
  const t = UI[lang];
  const [activeFilter, setActiveFilter] = useState('All');

  // Preserve the stored array order — that's the order the admin sets with the
  // move up / move down controls, so the first project in the array is the
  // first one shown here, and it's also first-seen-wins order for the
  // sections built below.
  const live = projects.filter((p) => p.status === 'live');
  const pool = live.filter((p) => matchesFilter(p, activeFilter));

  // One section per client, each its own auto-scrolling strip — projects
  // saved with no client fall back server-side to the literal string
  // "Placeholder" (app/api/projects/route.js), a human hint for the admin
  // table rather than a real name, so those (and any truly unassigned
  // project) get bucketed into one trailing, unlabeled section instead.
  const groupMap = new Map();
  let unassigned = null;
  for (const p of pool) {
    const name = (p.client || '').trim();
    const isUnassigned = !p.clientId && (!name || name === 'Placeholder');
    if (isUnassigned) {
      if (!unassigned) unassigned = { key: 'unassigned', name: null, logo: null, items: [] };
      unassigned.items.push(p);
      continue;
    }
    const key = p.clientId || `name:${name}`;
    if (!groupMap.has(key)) {
      const logo = p.clientId ? clients.find((c) => c.id === p.clientId)?.logo || null : null;
      groupMap.set(key, { key, name, logo, items: [] });
    }
    groupMap.get(key).items.push(p);
  }
  const galleries = [...groupMap.values(), ...(unassigned ? [unassigned] : [])];

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
          {galleries.length > 0 ? (
            galleries.map((g, gi) => (
              <Reveal as="section" className="client-gallery" key={g.key}>
                {g.name ? (
                  <div className="client-gallery-head">
                    {g.logo ? (
                      <img className="client-gallery-bg-logo" src={g.logo} alt="" aria-hidden="true" />
                    ) : null}
                    <h2>{g.name}</h2>
                  </div>
                ) : null}
                <div className="gallery-strip">
                  <div className="gallery-track">
                    {[0, 1].map((copy) => (
                      <div className={`gallery-group ${gi % 2 === 1 ? 'reverse' : ''}`} key={copy}>
                        {fillGroup(g.items).map((p, i) => (
                          <div className={`gallery-card ${isPortraitProject(p) ? 'is-portrait' : ''}`} key={`${copy}-${i}-${p.id}`}>
                            <div className="work-card-media">
                              {p.video ? (
                                <PortfolioVideo src={p.video} poster={p.image} label={p.category} orientation={p.orientation} />
                              ) : p.image ? (
                                // Real image: shown at its own natural size
                                // (plain <img>, not a background-image crop
                                // box) — the category label still overlays
                                // it, same as before.
                                <div className="work-card-img has-image">
                                  <img src={p.image} alt={p.title} className="work-card-img-el" />
                                  <span className="label">{p.category}</span>
                                </div>
                              ) : (
                                <div className="work-card-img" style={{ background: CARD_TINTS[i % CARD_TINTS.length] }}>
                                  <span className="label">{p.category}</span>
                                </div>
                              )}
                              <div className="gallery-card-caption">{p.title}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))
          ) : (
            <p className="portfolio-empty">{t.portfolio.empty}</p>
          )}
        </div>
      </section>

      <Footer settings={settings} lang={lang} />
    </div>
  );
}
