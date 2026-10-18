import { cookies } from 'next/headers';
import { getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE, UI } from '@/lib/i18n';
import AboutView from '@/components/AboutView';
import { pageMetadata } from '@/lib/site';

// See app/page.js for why there's no `force-dynamic` export here.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  // the tab title follows the visitor's language like the page does; a
  // crawler has no cookie, so it still gets the English one
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  return pageMetadata({
    title: `${lang === 'ar' ? UI.ar.nav.about : 'About'} — ${settings.siteName || 'Keda Agency'}`,
    description:
      'Who KEDA is and how we work — a full-service brand and creative agency based in Cairo, building for the Egyptian and MENA market.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const settings = mergeSettings(await getSettings());
  return <AboutView settings={settings} lang={lang} />;
}
