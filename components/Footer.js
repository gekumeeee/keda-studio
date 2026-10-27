import Link from 'next/link';
import { UI, SITE_COPY, pick } from '@/lib/i18n';

export default function Footer({ settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const c = SITE_COPY[lang].footer;
  const nav = SITE_COPY[lang].nav;
  const note = pick(settings.footerNote, lang) || '© 2026 KEDA Agency';
  const email = (settings.contactEmail || '').trim();
  const socials = [
    { url: settings.instagramUrl, label: 'Instagram' },
    { url: settings.facebookUrl, label: 'Facebook' },
    { url: settings.behanceUrl, label: 'Behance' },
    { url: settings.xUrl, label: 'X' },
  ].filter((s) => s.url && s.url.trim());

  return (
    <footer>
      <div className="f-top">
        <p className="t">{c.tagline}</p>
        <div className="f-col">
          <h4>{c.explore}</h4>
          <Link href="/">{t.nav.home}</Link>
          <Link href="/portfolio">{t.nav.portfolio}</Link>
          <Link href="/about">{t.nav.about}</Link>
          <Link href="/#services">{nav.services}</Link>
          <Link href="/#process">{nav.process}</Link>
          <Link href="/#faq">{nav.faq}</Link>
        </div>
        {socials.length > 0 ? (
          <div className="f-col">
            <h4>{c.follow}</h4>
            {socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>
            ))}
          </div>
        ) : null}
        <div className="f-col">
          <h4>{c.contact}</h4>
          <Link href="/contact">{t.nav.contact}</Link>
          {email ? <a href={`mailto:${email}`} dir="ltr">{email}</a> : null}
          <span className="f-city">{c.city}</span>
        </div>
      </div>
      <div className="f-word">
        <img src="/brand/keda-logo-white.png" alt="KEDA Agency" width="411" height="168" draggable={false} />
      </div>
      <div className="f-bot">
        <span>{note}</span>
        <span>{c.small}</span>
      </div>
    </footer>
  );
}
