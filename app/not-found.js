import Link from 'next/link';
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE, UI } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlyphStrip from '@/components/GlyphStrip';
import SectionHead from '@/components/SectionHead';

// Any URL that doesn't match a page. Next's built-in 404 was a bare line of
// system text with no way back into the site — and in Arabic its punctuation
// and divider landed on the wrong sides. This one is a normal page: the
// header, the site's heading, a way home.
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

  return (
    <div className="site">
      <Header settings={settings} lang={lang} />
      <section className="marketing-section not-found">
        <div className="wrap">
          <SectionHead level={1} title={t.notFound.heading} tag="404" />
          <p className="not-found-sub">{t.notFound.sub}</p>
          <Link href="/" className="hero-cta">{t.notFound.home}</Link>
        </div>
      </section>
      <GlyphStrip />
      <Footer settings={settings} lang={lang} />
    </div>
  );
}
