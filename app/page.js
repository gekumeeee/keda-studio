import { cookies } from 'next/headers';
import { getProjects, getClients, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import HomeView from '@/components/HomeView';
import { pageMetadata } from '@/lib/site';

// No `force-dynamic` here: cookies() below already forces this page to run
// per request regardless, so that export was redundant. The actual fix for
// per-visit Blob reads lives one layer down, in lib/store.js's getSettings()
// etc. — this page keeps re-executing every request (for the language
// cookie), but the data it reads is now served from a 60s cross-request
// cache instead of hitting Blob each time.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return pageMetadata({ title: settings.siteName || 'Keda Agency', path: '/' });
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, clients, savedSettings] = await Promise.all([getProjects(), getClients(), getSettings()]);
  const settings = mergeSettings(savedSettings);
  return <HomeView projects={projects} clients={clients} settings={settings} lang={lang} />;
}
