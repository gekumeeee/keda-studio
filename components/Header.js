import { UI, SITE_COPY } from '@/lib/i18n';
import NavBar from './site/NavBar';

// The header's data side: labels in the page's language and the social
// links the admin has filled in. The bar itself (scroll state, menu, theme)
// is the client component it hands these to.
export default function Header({ active, settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const c = SITE_COPY[lang];
  const socials = [
    { key: 'facebook', label: 'Facebook', url: settings.facebookUrl },
    { key: 'instagram', label: 'Instagram', url: settings.instagramUrl },
  ].filter((s) => s.url && s.url.trim());

  return (
    <NavBar
      active={active}
      lang={lang}
      socials={socials}
      labels={{
        home: t.nav.home,
        portfolio: t.nav.portfolio,
        about: t.nav.about,
        contact: t.nav.contact,
        services: c.nav.services,
        faq: c.nav.faq,
        menu: t.site.menu,
        theme: t.site.theme,
        brand: t.site.home,
      }}
    />
  );
}
