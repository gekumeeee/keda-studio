import Link from 'next/link';
import { UI } from '@/lib/i18n';
import LangToggle from './LangToggle';
import { FacebookIcon, InstagramIcon, BehanceIcon, XIcon } from './SocialIcons';
import HeaderScrollShell from './HeaderScrollShell';

export default function Header({ active, settings = {}, lang = 'en' }) {
  const t = UI[lang];
  const socials = [
    { url: settings.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { url: settings.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { url: settings.behanceUrl, label: 'Behance', Icon: BehanceIcon, cls: 'social-be' },
    { url: settings.xUrl, label: 'X', Icon: XIcon },
  ].filter((s) => s.url && s.url.trim());

  return (
    <HeaderScrollShell>
      <div className="wrap">
        <nav>
          <Link href="/" className="logo" aria-label="KEDA — home">
            {/* the logo is only ever ink or paper — never coloured. The header
                sits on the ink ground, so it takes the white mark. The nav is
                tight, so it's the logomark alone rather than the full lockup. */}
            <img src="/brand/keda-logomark-white.svg" alt="KEDA" className="logo-img" />
          </Link>
          <div className="nav-links">
            <Link href="/" className={active === 'home' ? 'active' : ''}>{t.nav.home}</Link>
            <Link href="/portfolio" className={active === 'portfolio' ? 'active' : ''}>{t.nav.portfolio}</Link>
            <Link href="/about" className={active === 'about' ? 'active' : ''}>{t.nav.about}</Link>
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
            <Link href="/contact" className="nav-cta">{t.nav.contact}</Link>
          </div>
        </nav>
      </div>
    </HeaderScrollShell>
  );
}
