import { cookies } from 'next/headers';
import { getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE, UI, pick } from '@/lib/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageHead from '@/components/site/PageHead';
import BlockStrip from '@/components/site/BlockStrip';
import ContactForm from '@/components/ContactForm';
import EmailCopy from '@/components/EmailCopy';
import { pageMetadata } from '@/lib/site';

// See app/(site)/page.js for why there's no `force-dynamic` export here.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  // the tab title follows the visitor's language like the page does; a
  // crawler has no cookie, so it still gets the English one
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  return pageMetadata({
    title: `${lang === 'ar' ? UI.ar.nav.contact : 'Contact'} — ${settings.siteName || 'Keda Agency'}`,
    description:
      'Start a project with KEDA. Tell us about your brand and we’ll get back to you — no chatbots, just the agency.',
    path: '/contact',
  });
}

export default async function ContactPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const t = UI[lang];
  const settings = mergeSettings(await getSettings());

  return (
    <>
      <Header active="contact" settings={settings} lang={lang} />
      <main id="top">
        <PageHead
          eyebrow={t.contact.eyebrow}
          line1={pick(settings.contactHeadingLine1, lang)}
          line2={pick(settings.contactHeadingLine2, lang)}
        />
        <BlockStrip />
        <section className="sec">
          <div className="wrap contact">
            <div className="contact-side rv">
              <h2 className="d" style={{ fontSize: 'clamp(34px,4vw,56px)' }}>{t.contact.heading}</h2>
              <p className="lead">{t.contact.sub}</p>
              {settings.contactEmail ? (
                <EmailCopy
                  email={settings.contactEmail}
                  dropLabel={pick(settings.contactDropLabel, lang)}
                  copyLabel={t.contact.copyEmail}
                  copiedLabel={t.contact.copiedEmail}
                />
              ) : null}
            </div>
            <ContactForm lang={lang} />
          </div>
        </section>
      </main>
      <Footer settings={settings} lang={lang} />
    </>
  );
}
