import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import PageHead, { splitTitle } from './site/PageHead';
import BlockStrip from './site/BlockStrip';
import ImpactStats from './site/ImpactStats';
import CtaBlock from './site/CtaBlock';
import { ArrowIcon } from './site/Icons';
import { SITE_COPY, pick } from '@/lib/i18n';

// The about page: a page head, the violet panel with "كده" set as a
// dictionary entry beside who KEDA is, then the impact numbers.
export default function AboutView({ settings, lang = 'en' }) {
  const c = SITE_COPY[lang].about;
  const [line1, line2] = splitTitle(pick(settings.aboutPanelHeading, lang));
  const eyebrow = pick(settings.aboutEyebrow, lang);

  return (
    <>
      <Header active="about" settings={settings} lang={lang} />
      <main id="top">
        <PageHead eyebrow={eyebrow} line1={line1} line2={line2} sub={c.pageSub} />
        <BlockStrip />
        <section className="sec" id="about">
          <div className="wrap about rv">
            <div className="ab-side d" aria-hidden="true">{pick(settings.aboutSideLabel, lang)}</div>
            <div className="ab-main">
              <span className="eyebrow"><i />{eyebrow}</span>
              <h2 className="d">{pick(settings.aboutHeading, lang).replace(/\n/g, ' ')}</h2>
              <p>{pick(settings.aboutBody, lang)}</p>
              <div className="ab-pills">
                {c.pills.map((p) => <span key={p}>{p}</span>)}
              </div>
              <Link className="btn btn-paper" href="/contact">
                <span>{pick(settings.ctaButton, lang)}</span>
                <ArrowIcon />
              </Link>
            </div>
            <div className="ab-card">
              {settings.aboutImage ? (
                <img className="ab-photo" src={settings.aboutImage} alt="" draggable={false} />
              ) : null}
              <div className="dict">
                <img className="t" src="/blocks/block-02.svg" alt="" draggable={false} />
                <img className="b" src="/blocks/block-09.svg" alt="" draggable={false} />
                <div className="w">كده</div>
                <div className="ph"><span dir="ltr">/ˈke.da/</span> <i>{c.kind}</i></div>
                <hr />
                <p className="df"><b>{c.defTag}</b>{c.def}</p>
              </div>
            </div>
          </div>
        </section>
        <ImpactStats settings={settings} lang={lang} padTop={false} />
        <CtaBlock settings={settings} lang={lang} />
      </main>
      <Footer settings={settings} lang={lang} />
    </>
  );
}
