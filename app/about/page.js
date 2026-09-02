import { cookies } from 'next/headers';
import { getProjects, getClients, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import AboutView from '@/components/AboutView';
import { pageMetadata } from '@/lib/site';

// See app/page.js for why there's no `force-dynamic` export here.
export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return pageMetadata({
    title: `About — ${settings.siteName || 'Keda Agency'}`,
    description:
      'Who KEDA is and how we work — a full-service brand and creative agency based in Cairo, building for the Egyptian and MENA market.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, clients, savedSettings] = await Promise.all([getProjects(), getClients(), getSettings()]);
  const settings = mergeSettings(savedSettings);
  const projectCount = projects.filter((p) => p.status === 'live').length;
  return <AboutView projectCount={projectCount} clientCount={clients.length} settings={settings} lang={lang} />;
}
