'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import LangToggle from '../LangToggle';
import { ArrowIcon, FacebookIcon, InstagramIcon } from './Icons';

const ICONS = { facebook: FacebookIcon, instagram: InstagramIcon };

// The shared header: one rounded bar with the full logo, the three pages,
// the socials, theme and language switches and the "Contact us" button. On a
// phone everything but the logo, theme and language folds into the burger,
// which opens a full-screen menu.
export default function NavBar({ active, lang, labels, socials }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // the open menu covers the page: hold the page still under it, and let
  // Escape close it like the burger does
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pages = [
    { href: '/', key: 'home', label: labels.home },
    { href: '/portfolio', key: 'portfolio', label: labels.portfolio },
    { href: '/about', key: 'about', label: labels.about },
  ];
  const close = () => setOpen(false);
  const socialLinks = (cls) =>
    socials.map(({ key, url, label }) => {
      const Icon = ICONS[key];
      return (
        <a key={key} className={cls} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
          <Icon />
        </a>
      );
    });

  return (
    <>
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-in">
          <Link className="brand" href="/" aria-label={labels.brand}>
            <img className="logo-d" src="/brand/keda-logo-white.png" alt="KEDA Agency" width="411" height="168" draggable={false} />
            <img className="logo-l" src="/brand/keda-logo-black.png" alt="KEDA Agency" width="411" height="168" draggable={false} />
          </Link>
          <nav className="links" aria-label="Main">
            {pages.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className={active === p.key ? 'active' : undefined}
                aria-current={active === p.key ? 'page' : undefined}
              >
                {p.label}
              </Link>
            ))}
          </nav>
          <div className="nav-r">
            {socialLinks('ic soc')}
            <ThemeToggle label={labels.theme} />
            <LangToggle lang={lang} />
            <Link className="nav-cta" href="/contact">
              <span>{labels.contact}</span>
              <ArrowIcon />
            </Link>
            <button
              className="burger"
              type="button"
              aria-label={labels.menu}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <i />
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>
      {/* inert while closed: it's drawn (clipped to a point), so without this
          a keyboard user would tab through its hidden links */}
      <div className={`menu${open ? ' open' : ''}`} id="site-menu" inert={!open}>
        {pages.map((p) => (
          <Link key={p.key} className="m" href={p.href} onClick={close}>{p.label}</Link>
        ))}
        <Link className="m" href="/#services" onClick={close}>{labels.services}</Link>
        <Link className="m" href="/#faq" onClick={close}>{labels.faq}</Link>
        <div className="menu-foot">
          <Link className="nav-cta" href="/contact" style={{ margin: 0 }} onClick={close}>
            <span>{labels.contact}</span>
            <ArrowIcon />
          </Link>
          {socialLinks('ic')}
        </div>
      </div>
    </>
  );
}
