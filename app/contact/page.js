import { cookies } from 'next/headers';
import { getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlyphStrip from '@/components/GlyphStrip';
import ContactForm from '@/components/ContactForm';
import EmailCopy from '@/components/EmailCopy';
import { UI, pick } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return { title: `Contact — ${settings.siteName || 'KEDA'}` };
}

export default async function ContactPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = UI[lang];
  const settings = mergeSettings(await getSettings());

  return (
    <>
      <Header active="contact" settings={settings} lang={lang} />

      <section className="page-hero">
        <div className="wrap reveal in">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h1 className="contact-big-heading">
            <span>{pick(settings.contactHeadingLine1, lang)}</span>
            <b>{pick(settings.contactHeadingLine2, lang)}</b>
          </h1>
        </div>
      </section>

      <section className="marketing-section contact-layout">
        <div className="wrap contact-layout-grid">
          <div className="reveal in">
            <p className="contact-side-sub">{t.contact.sub}</p>
            {settings.contactEmail && (
              <EmailCopy
                email={settings.contactEmail}
                dropLabel={pick(settings.contactDropLabel, lang)}
                copyLabel={t.contact.copyEmail}
                copiedLabel={t.contact.copiedEmail}
              />
            )}
          </div>
          <ContactForm contactEmail="" lang={lang} />
        </div>
      </section>

      <GlyphStrip />
      <Footer settings={settings} lang={lang} />
    </>
  );
}
