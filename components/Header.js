import { UI } from '@/lib/i18n';
import LangToggle from './LangToggle';
import { FacebookIcon, InstagramIcon, BehanceIcon, XIcon } from './SocialIcons';

export default function Header({ active, settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const socials = [
    { url: settings.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { url: settings.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { url: settings.behanceUrl, label: 'Behance', Icon: BehanceIcon, cls: 'social-be' },
    { url: settings.xUrl, label: 'X', Icon: XIcon },
  ].filter((s) => s.url && s.url.trim());

  return (
    <header>
      <div className="wrap">
        <nav>
          <a href="/" className="logo" aria-label="KEDA — home">
            <img src="/keda-white.png" alt="KEDA" className="logo-img" />
          </a>
          <div className="nav-links">
            <a href="/" className={active === 'home' ? 'active' : ''}>{t.nav.home}</a>
            <a href="/portfolio" className={active === 'portfolio' ? 'active' : ''}>{t.nav.portfolio}</a>
            <a href="/about" className={active === 'about' ? 'active' : ''}>{t.nav.about}</a>
          </div>
          <div className="nav-right">
            {socials.length > 0 && (
              <div className="nav-social">
                {socials.map(({ url, label, Icon, cls }) => (
                  <a key={label} href={url} aria-label={label} className={cls} target="_blank" rel="noreferrer"><Icon /></a>
                ))}
              </div>
            )}
            <LangToggle lang={lang} />
            <a href="/contact" className="nav-cta">{t.nav.contact}</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
