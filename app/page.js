import { cookies } from 'next/headers';
import { getProjects, getClients, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import HomeView from '@/components/HomeView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return {
    title: `${settings.siteName || 'KEDA'} — Brand & Creative Studio`,
  };
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, clients, savedSettings] = await Promise.all([getProjects(), getClients(), getSettings()]);
  const settings = mergeSettings(savedSettings);
  return <HomeView projects={projects} clients={clients} settings={settings} lang={lang} />;
}
