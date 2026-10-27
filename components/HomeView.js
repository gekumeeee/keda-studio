import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import RotatingWord from './RotatingWord';
import ClientCardFan from './ClientCardFan';
import HeroStage from './site/HeroStage';
import HeroFaces from './site/HeroFaces';
import BlockStrip from './site/BlockStrip';
import ClientsMarquee from './site/ClientsMarquee';
import ServicesTabs from './site/ServicesTabs';
import ImpactStats from './site/ImpactStats';
import Faq from './site/Faq';
import CtaBlock from './site/CtaBlock';
import { ArrowIcon } from './site/Icons';
import { SITE_COPY, pick } from '@/lib/i18n';

const STEP_COLORS = ['var(--acid)', 'var(--magenta)', 'var(--aqua)', 'var(--tangerine)'];
const AUDIENCES = [
  { c: 'var(--acid)', fg: 'var(--ink)', block: '03', r: '-8deg' },
  { c: 'var(--magenta)', fg: 'var(--ink)', block: '05', r: '8deg' },
  { c: 'var(--cobalt)', fg: 'var(--paper)', block: '01', r: '-6deg' },
];
const lines = (text) => String(text || '').replace(/\n/g, ' ');

export default function HomeView({ clients, settings, lang = 'en', fanCards = [] }) {
  const c = SITE_COPY[lang];
  const fixedHeading = pick(settings.heroHeading, lang);
  const words = settings.heroWords
    .map((w) => ({ text: pick(w.text, lang), color: w.color }))
    .filter((w) => w.text);
  const services = settings.services.map((s) => ({
    title: pick(s.title, lang),
    tab: pick(s.tab, lang),
    desc: pick(s.desc, lang),
    stat: s.stat,
    statLabel: pick(s.statLabel, lang),
    image: s.image,
    points: pick(s.points, lang).split('\n').map((p) => p.trim()).filter(Boolean),
  }));

  return (
    <>
      <Header active="home" settings={settings} lang={lang} />
      <main id="top">
        <HeroStage className="hero">
          <div className="hero-in">
            <p className="eyebrow rv"><span>{pick(settings.heroEyebrow, lang)}</span></p>
            <div className="hero-type">
              <HeroFaces variant="home" />
              {fixedHeading ? (
                <h1 className="d fixed">
                  <span className="ln">{fixedHeading}</span>
                </h1>
              ) : (
                <h1 className="d">
                  <span className="ln" style={{ '--i': 0 }}>{pick(settings.heroLine1, lang)}</span>
                  {words.length ? (
                    <span className="ln" style={{ '--i': 1 }}>
                      <RotatingWord words={words} />
                    </span>
                  ) : null}
                  <span className="ln" style={{ '--i': 2 }}>{pick(settings.heroLine3, lang)}</span>
                </h1>
              )}
            </div>
            <p className="sub rv" style={{ '--d': '.16s' }}>{pick(settings.heroPara, lang)}</p>
            <div className="hero-cta rv" style={{ '--d': '.24s' }}>
              <Link className="btn btn-acid mag" href="/contact">
                <span>{pick(settings.heroCtaLabel, lang).replace(/\s*[→←]\s*$/, '')}</span>
                <ArrowIcon />
              </Link>
              <Link className="btn btn-line mag" href="/portfolio">
                <span>{c.seeWork}</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>
          <ClientCardFan cards={fanCards} />
        </HeroStage>

        <BlockStrip />

        {clients.length ? (
          <section className="sec" id="clients" style={{ paddingTop: 'clamp(36px,4vw,56px)' }}>
            <div className="wrap">
              <div className="cl-head rv">
                <div>
                  <span className="eyebrow"><i />{pick(settings.clientsEyebrow, lang)}</span>
                  <h2 className="d">{lines(pick(settings.clientsHeading, lang))}</h2>
                </div>
                <p>{c.clientsLead}</p>
              </div>
              <ClientsMarquee clients={clients} />
            </div>
          </section>
        ) : null}

        {services.length ? (
          <section className="sec" id="services" style={clients.length ? { paddingTop: 0 } : undefined}>
            <div className="wrap">
              <div className="svc-head rv">
                <span className="eyebrow"><i />{pick(settings.servicesEyebrow, lang)}</span>
                <h2 className="d">{lines(pick(settings.servicesHeading, lang))}</h2>
                <p className="lead">{c.servicesLead}</p>
              </div>
              <ServicesTabs
                services={services}
                startLabel={pick(settings.ctaButton, lang)}
                tablistLabel={pick(settings.servicesEyebrow, lang)}
              />
            </div>
          </section>
        ) : null}

        <section className="sec" id="process" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="pp rv">
              <div>
                <span className="eyebrow"><i />{c.process.eyebrow}</span>
                <h2 className="d">{c.process.heading}</h2>
                <p className="lead">{c.process.lead}</p>
                <Link className="btn btn-fg" href="/contact">
                  <span>{c.process.button}</span>
                  <ArrowIcon />
                </Link>
              </div>
              <div className="steps">
                {c.process.steps.map((s, i) => (
                  <article className="step rv" key={i} style={{ '--d': `${0.05 + i * 0.07}s` }}>
                    <span className="pill" style={{ '--c': STEP_COLORS[i] }}>{s.tag}</span>
                    <h3 className="d">{s.title}</h3>
                    <p>{s.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ImpactStats settings={settings} lang={lang} />

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="aud-head rv">
              <span className="eyebrow"><i />{c.audiences.eyebrow}</span>
              <h2 className="d">{c.audiences.heading}</h2>
            </div>
            <div className="aud">
              {c.audiences.items.map((a, i) => {
                const look = AUDIENCES[i];
                return (
                  <article className="ac rv" key={i} style={{ '--c': look.c, '--fg': look.fg, '--d': `${0.05 + i * 0.07}s` }}>
                    <header>{a.tag}</header>
                    <div className="ac-b">
                      <h3>{a.title}</h3>
                      <p>{a.body}</p>
                      <img src={`/blocks/block-${look.block}.svg`} alt="" style={{ '--r': look.r }} draggable={false} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="sec" id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap faq">
            <div className="rv">
              <span className="eyebrow"><i />{c.faq.eyebrow}</span>
              <h2 className="d">{c.faq.heading}</h2>
            </div>
            <Faq items={c.faq.items} />
          </div>
        </section>

        <CtaBlock settings={settings} lang={lang} />
      </main>
      <Footer settings={settings} lang={lang} />
    </>
  );
}
