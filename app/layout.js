import './globals.css';
import { cookies } from 'next/headers';
import { normalizeLang, LANG_COOKIE } from '@/lib/i18n';
import LoadingSplash from '@/components/LoadingSplash';

export const metadata = {
  title: 'Keda Agency',
  description:
    'KEDA is a full-service brand and creative agency in Cairo, building distinct, timeless brands for the Egyptian and MENA market.',
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
