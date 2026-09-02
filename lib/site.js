// One place for the values that have to be identical across metadata,
// sitemap.xml, robots.txt and the generated social image — they all need
// absolute URLs, and having each file guess its own was how they'd drift.
//
// The env var lets a preview deployment describe itself correctly without a
// code change; the fallback is the live domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kedaagency.com').replace(/\/$/, '');

export const SITE_NAME = 'KEDA Agency';

export const SITE_DESCRIPTION =
  'KEDA is a full-service brand and creative agency in Cairo, building distinct, timeless brands for the Egyptian and MENA market.';

// Public pages only. /admin, /api and /report-template are deliberately
// absent — see app/robots.js, which also blocks them from crawlers.
export const PUBLIC_ROUTES = ['', '/portfolio', '/about', '/contact'];

// Builds one page's metadata: title, description, canonical URL and the
// matching social tags, which otherwise meant repeating the same openGraph
// and twitter blocks in all four pages and letting them drift.
//
// `title` is set as `absolute` so the page keeps composing its own full
// title from the site name configured in the admin, rather than the layout
// template appending a second, hard-coded one.
export function pageMetadata({ title, description = SITE_DESCRIPTION, path = '/' }) {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      type: 'website',
      siteName: SITE_NAME,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
