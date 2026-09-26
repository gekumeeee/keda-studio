import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import DiagMarquee from './DiagMarquee';
import Reveal from './Reveal';
import SectionHead from './SectionHead';
import CountUp from './CountUp';
import { UI, pick } from '@/lib/i18n';

export default function AboutView({ projectCount, clientCount, settings, lang = 'en' }) {
  const t = UI[lang];

  return (
    <div className="site">
      <Header active="about" settings={settings} lang={lang} />

      <section className="marketing-section" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <SectionHead level={1} title={pick(settings.aboutHeading, lang)} tag={pick(settings.aboutEyebrow, lang)} />
        </div>
      </section>

      <section className="marketing-section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="about-panel">
            <div className="about-panel-side">{pick(settings.aboutSideLabel, lang)}</div>
            <div className="about-panel-text">
              <h3>{pick(settings.aboutPanelHeading, lang)}</h3>
              <p>{pick(settings.aboutBody, lang)}</p>
            </div>
            <div className="about-panel-media">
              {settings.aboutImage ? (
                <img src={settings.aboutImage} alt={pick(settings.aboutPanelHeading, lang)} />
              ) : (
                // no photo set in the admin yet: the brand mark holds the
                // space rather than the word "KEDA" typed in grey
                <div className="about-panel-media-fallback" aria-hidden="true">
                  <img src="/brand/keda-logomark-white.svg" alt="" />
                </div>
              )}
            </div>
          </Reveal>

          <Reveal className="about-stats about-stats-standalone">
            <div className="stat">
              <CountUp target={projectCount} />
              <div className="label">{t.about.statProjects}</div>
            </div>
            <div className="stat">
              <CountUp target={clientCount} />
              <div className="label">{t.about.statClients}</div>
            </div>
          </Reveal>
        </div>
      </section>

      <DiagMarquee />

      <section className="big-cta">
        <div className="accent-band sec-cobalt">
          <Reveal className="wrap">
            <h2>
              <span className="line1">{pick(settings.ctaLine1, lang)}</span>
              <span className="line2">{pick(settings.ctaLine2, lang)}</span>
            </h2>
            <Link href="/contact" className="cta-btn">{pick(settings.ctaButton, lang)}</Link>
          </Reveal>
        </div>
      </section>

      <Footer settings={settings} lang={lang} />
    </div>
  );
}
