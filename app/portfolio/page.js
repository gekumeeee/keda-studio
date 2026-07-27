import { cookies } from 'next/headers';
import { getProjects, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import PortfolioView from '@/components/PortfolioView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = mergeSettings(await getSettings());
  return { title: `Portfolio — ${settings.siteName || 'KEDA'}` };
}

export default async function PortfolioPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const [projects, savedSettings] = await Promise.all([getProjects(), getSettings()]);
  const settings = mergeSettings(savedSettings);
  return <PortfolioView projects={projects} settings={settings} lang={lang} />;
}
