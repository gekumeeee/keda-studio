import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE, UI } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SiteChrome from '@/components/site/SiteChrome';
import PageHead from '@/components/site/PageHead';
import BlockStrip from '@/components/site/BlockStrip';
import { ArrowIcon } from '@/components/site/Icons';
// This page renders outside the (site) route group, so it brings the public
// stylesheet itself.
import './(site)/site.css';

// Any URL that doesn't match a page: a normal page of the site, with the
// header, a way home and the footer.
export async function generateMetadata() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  return {
    title: lang === 'ar' ? 'الصفحة مش موجودة' : 'Page not found',
    robots: { index: false },
  };
}

export default async function NotFound() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = UI[lang];
  const settings = mergeSettings(await getSettings());
  const [line1, ...rest] = t.notFound.heading.split(' ');

  return (
    <SiteChrome>
      <Header settings={settings} lang={lang} />
      <main id="top">
        <PageHead className="nf" eyebrow="404" line1={line1} line2={rest.join(' ')} sub={t.notFound.sub}>
          <div className="hero-cta rv" style={{ '--d': '.24s' }}>
            <Link className="btn btn-acid" href="/">
              <span>{t.notFound.home.replace(/\s*[→←]\s*$/, '')}</span>
              <ArrowIcon />
            </Link>
          </div>
        </PageHead>
        <BlockStrip />
      </main>
      <Footer settings={settings} lang={lang} />
    </SiteChrome>
  );
}
