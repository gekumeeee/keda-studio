import { cookies } from 'next/headers';
import { getProjects, getClients, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import AboutView from '@/components/AboutView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return { title: `About — ${settings.siteName || 'KEDA'}` };
}

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, clients, savedSettings] = await Promise.all([getProjects(), getClients(), getSettings()]);
  const settings = mergeSettings(savedSettings);
  const projectCount = projects.filter((p) => p.status === 'live').length;
  return <AboutView projectCount={projectCount} clientCount={clients.length} settings={settings} lang={lang} />;
}
