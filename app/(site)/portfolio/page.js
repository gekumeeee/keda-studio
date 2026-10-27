import { cookies } from 'next/headers';
import { getProjects, getSettings, getClients } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE, UI } from '@/lib/i18n';
import PortfolioView from '@/components/PortfolioView';
import { pageMetadata } from '@/lib/site';

// See app/page.js for why there's no `force-dynamic` export here — cookies()
// below already forces per-request rendering; the Blob-read fix is in
// lib/store.js's cross-request cache, not at this page's dynamic/static config.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  // the tab title follows the visitor's language like the page does; a
  // crawler has no cookie, so it still gets the English one
  const lang = normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  return pageMetadata({
    title: `${lang === 'ar' ? UI.ar.nav.portfolio : 'Portfolio'} — ${settings.siteName || 'Keda Agency'}`,
    description:
      'Selected branding, video, social and campaign work by KEDA — a brand and creative agency in Cairo.',
    path: '/portfolio',
  });
}

export default async function PortfolioPage({ searchParams }) {
  // ?client=<id> opens the page on one client's gallery (the hero cards and
  // the clients strip link here that way)
  const query = await searchParams;
  const initialClient = typeof query?.client === 'string' ? query.client.slice(0, 200) : '';
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, savedSettings, clients] = await Promise.all([getProjects(), getSettings(), getClients()]);
  const settings = mergeSettings(savedSettings);
  return <PortfolioView projects={projects} settings={settings} clients={clients} lang={lang} initialClient={initialClient} />;
}
