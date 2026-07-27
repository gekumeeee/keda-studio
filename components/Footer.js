import { UI, pick } from '@/lib/i18n';
import { FacebookIcon, InstagramIcon, BehanceIcon, XIcon } from './SocialIcons';

export default function Footer({ settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const note = pick(settings.footerNote, lang) || '© 2026 KEDA — Brand & Creative Studio, Cairo';
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
            <img src="/keda-white.png" alt="KEDA" className="foot-logo-img" />
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
            <a href="/">{t.foot.home}</a>
            <a href="/portfolio">{t.foot.portfolio}</a>
            <a href="/about">{t.foot.about}</a>
          </div>
          <div className="foot-col">
            <h5>{t.foot.utility}</h5>
            <a href="#">{t.foot.privacy}</a>
            <a href="/contact">{t.foot.contact}</a>
            <a href="#">{t.foot.imprint}</a>
          </div>
        </div>
        <div className="foot-bottom">{note}</div>
      </div>
    </footer>
  );
}
