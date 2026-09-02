import './globals.css';
import { cookies } from 'next/headers';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site';
import LoadingSplash from '@/components/LoadingSplash';

// Defaults every page inherits and can override. metadataBase is what makes
// the relative image/canonical paths below resolve to absolute URLs — social
// crawlers reject relative ones, so without it a shared link renders as bare
// text no matter what else is set here.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Page titles read "Portfolio — KEDA Agency" without each page
    // repeating the suffix.
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    alternateLocale: 'ar_EG',
    // The image itself comes from app/opengraph-image.js — Next attaches it
    // automatically, so listing it here would only duplicate the tag.
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Cairo:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LoadingSplash />
        <img src="/brand/keda-logomark-white.svg" alt="" aria-hidden="true" className="site-watermark" />
        {children}
      </body>
    </html>
  );
}
