import { SITE_URL, PUBLIC_ROUTES } from '@/lib/site';

// Served at /sitemap.xml. Only the four public pages — the site has no
// per-project routes yet, so there's nothing else worth handing a crawler.
// Priorities say what matters commercially: the work and the way to get in
// touch, before the about page.
const PRIORITY = {
  '': 1,
  '/portfolio': 0.9,
  '/contact': 0.8,
  '/about': 0.7,
};

export default function sitemap() {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/portfolio' ? 'weekly' : 'monthly',
    priority: PRIORITY[route] ?? 0.5,
  }));
}
