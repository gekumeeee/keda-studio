'use client';

import { useEffect, useRef } from 'react';

// Drives the header's shrink-on-scroll continuously (0→1 over the first
// 120px), tied to scroll position rather than a hard class flip. Values are
// computed in JS and written as direct inline styles on the header/nav/logo
// elements (found via querySelector inside this wrapper) rather than through
// a CSS custom property + calc() — calc() referencing a JS-mutated custom
// property doesn't reliably re-evaluate on every engine, while plain inline
// style writes always do. CSS `transition` on these same properties (see
// globals.css) is what makes the JS-driven changes animate smoothly.
export default function HeaderScrollShell({ children }) {
  const headerRef = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const nav = el.querySelector('nav');
    const logo = el.querySelector('.logo-img');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function apply() {
      const p = reduced ? (window.scrollY > 4 ? 1 : 0) : Math.min(window.scrollY / 120, 1);
      el.style.paddingBlock = `${26 - 12 * p}px`;
      if (nav) {
        nav.style.paddingBlock = `${12 - 4 * p}px`;
        // --ink, the site's ground, deepening as the header shrinks
        nav.style.background = `rgba(13,13,13,${(0.62 + 0.28 * p).toFixed(3)})`;
      }
      if (logo) logo.style.height = `${46 - 10 * p}px`;
    }
    function onScroll() {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        apply();
      });
    }
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <header ref={headerRef}>{children}</header>;
}
