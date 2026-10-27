import Header from './Header';
import Footer from './Footer';
import PageHead, { splitTitle } from './site/PageHead';
import BlockStrip from './site/BlockStrip';
import CtaBlock from './site/CtaBlock';
import PortfolioGallery from './site/PortfolioGallery';
import { getVideoEmbed, guessEmbedOrientation } from '@/lib/videoEmbed';
import { UI, SITE_COPY, pick } from '@/lib/i18n';

// A video-only project's picture: YouTube serves a public thumbnail; the
// other platforms would need an API call, so those show a plain play card.
function posterFor(p) {
  if (p.image && p.image.trim()) return p.image.trim();
  const embed = getVideoEmbed(p.video);
  const yt = embed.kind === 'embed' && embed.embedUrl.match(/youtube\.com\/embed\/([\w-]{11})/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : '';
}

function orientationFor(p) {
  if (p.orientation && p.orientation !== 'auto') return p.orientation;
  const embed = getVideoEmbed(p.video);
  return embed.kind === 'embed' ? guessEmbedOrientation(p.video) : 'auto';
}

// One gallery per client, built the way the site always has: live work only,
// in the order the admin set, grouped by the linked client record, else by
// the typed client name. Work with neither ("Placeholder" is the API's
// stand-in for "no client") goes into one last group.
export function groupPortfolio(projects, clients, t) {
  const groupMap = new Map();
  let unassigned = null;
  for (const p of projects.filter((x) => x.status === 'live')) {
    const name = (p.client || '').trim();
    const item = {
      id: p.id,
      title: p.title || '',
      image: posterFor(p),
      video: p.video || '',
      orientation: orientationFor(p),
      label: t.filters[p.category] || p.category || '',
    };
    if (!item.image && !item.video) continue;
    if (!p.clientId && (!name || name === 'Placeholder')) {
      if (!unassigned) unassigned = { key: 'unassigned', name: t.site.moreWork, logo: '', items: [] };
      unassigned.items.push(item);
      continue;
    }
    const key = p.clientId || `name:${name}`;
    if (!groupMap.has(key)) {
      const record = p.clientId ? clients.find((c) => c.id === p.clientId) : null;
      groupMap.set(key, { key, name: record?.name || name, logo: record?.logo || '', items: [] });
    }
    groupMap.get(key).items.push(item);
  }
  return [...groupMap.values(), ...(unassigned ? [unassigned] : [])];
}

export default function PortfolioView({ projects, settings, clients = [], lang = 'en', initialClient = '' }) {
  const t = UI[lang];
  const galleries = groupPortfolio(projects, clients, t);
  // ?client= is a client id (the fan and the clients strip link that way),
  // or a gallery's own key. A client whose work only carries its name
  // (no link to the record) is found by that name.
  let initial = 'all';
  if (initialClient) {
    if (galleries.some((g) => g.key === initialClient)) initial = initialClient;
    else {
      const record = clients.find((c) => c.id === initialClient);
      const byName = record && galleries.find((g) => g.key === `name:${record.name}`);
      if (byName) initial = byName.key;
    }
  }
  const [line1, line2] = splitTitle(pick(settings.portfolioHeading, lang));

  return (
    <>
      <Header active="portfolio" settings={settings} lang={lang} />
      <main id="top">
        <PageHead eyebrow={pick(settings.portfolioEyebrow, lang)} line1={line1} line2={line2} sub={SITE_COPY[lang].workLead} />
        <BlockStrip />
        <section className="work inset flush" id="work">
          {galleries.length ? (
            <PortfolioGallery key={initial} galleries={galleries} initial={initial} labels={t.site} lang={lang} />
          ) : (
            <p className="pf-empty">{t.portfolio.empty}</p>
          )}
        </section>
        <CtaBlock settings={settings} lang={lang} />
      </main>
      <Footer settings={settings} lang={lang} />
    </>
  );
}
