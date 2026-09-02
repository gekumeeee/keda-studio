import { cookies } from 'next/headers';
import { getProjects, getSettings, getClients } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import PortfolioView from '@/components/PortfolioView';
import { pageMetadata } from '@/lib/site';

// See app/page.js for why there's no `force-dynamic` export here — cookies()
// below already forces per-request rendering; the Blob-read fix is in
// lib/store.js's cross-request cache, not at this page's dynamic/static config.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return pageMetadata({
    title: `Portfolio — ${settings.siteName || 'Keda Agency'}`,
    description:
      'Selected branding, video, social and campaign work by KEDA — a brand and creative agency in Cairo.',
    path: '/portfolio',
  });
}

export default async function PortfolioPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, savedSettings, clients] = await Promise.all([getProjects(), getSettings(), getClients()]);
  const settings = mergeSettings(savedSettings);
  return <PortfolioView projects={projects} settings={settings} clients={clients} lang={lang} />;
}
