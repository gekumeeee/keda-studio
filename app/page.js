import { cookies } from 'next/headers';
import { getProjects, getClients, getSettings } from '@/lib/store';
import { mergeSettings } from '@/lib/defaults';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import HomeView from '@/components/HomeView';
import { pageMetadata } from '@/lib/site';
import { buildFanCards, faceFor } from '@/lib/cardFan';
import { getSwatch } from '@/lib/imageSwatch';

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
  // The hero card fan is assembled here rather than in HomeView (a client
  // component) because each image's colours are read on the server, so the
  // brand character on the card can match the picture it sits on — see
  // lib/imageSwatch.js for why that can't be done in the browser. Colours are
  // cached per image, so this only costs anything the first time an image
  // is seen.
  const fanCards = await Promise.all(
    buildFanCards(clients, projects, lang).map(async (card, i) => ({
      ...card,
      slides: await Promise.all(card.slides.map(async (src) => ({ src, face: faceFor(await getSwatch(src), i) }))),
    }))
  );
  return <HomeView projects={projects} clients={clients} settings={settings} lang={lang} fanCards={fanCards} />;
}
