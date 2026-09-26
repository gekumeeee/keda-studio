import Link from 'next/link';
import { UI, pick } from '@/lib/i18n';
import { FacebookIcon, InstagramIcon, BehanceIcon, XIcon } from './SocialIcons';

export default function Footer({ settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const note = pick(settings.footerNote, lang) || '© 2026 KEDA — Brand & Creative Agency, Cairo';
  const email = (settings.contactEmail || '').trim();
  const socials = [
    { url: settings.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { url: settings.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { url: settings.behanceUrl, label: 'Behance', Icon: BehanceIcon, cls: 'social-be' },
    { url: settings.xUrl, label: 'X', Icon: XIcon },
  ].filter((s) => s.url && s.url.trim());

  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            {/* the footer has room for the full lockup (mark + wordmark) */}
            <img src="/brand/keda-logo-white.svg" alt="KEDA Agency" className="foot-logo-img" />
            {socials.length > 0 && (
              <div className="foot-social">
                {socials.map(({ url, label, Icon, cls }) => (
                  <a key={label} href={url} aria-label={label} className={cls} target="_blank" rel="noreferrer"><Icon /></a>
                ))}
              </div>
            )}
          </div>
          <div className="foot-col">
            <h5>{t.foot.pages}</h5>
            <Link href="/">{t.foot.home}</Link>
            <Link href="/portfolio">{t.foot.portfolio}</Link>
            <Link href="/about">{t.foot.about}</Link>
          </div>
          <div className="foot-col">
            <h5>{t.foot.utility}</h5>
            <Link href="/contact">{t.foot.contact}</Link>
            {/* Only a real address gets a link — the column used to carry
                "Privacy" and "Imprint" entries that pointed at "#" and went
                nowhere. */}
            {email ? <a href={`mailto:${email}`}>{email}</a> : null}
          </div>
        </div>
        <div className="foot-bottom">{note}</div>
      </div>
    </footer>
  );
}
