'use client';

// Dark / light switch, shared by the site and the admin. The theme lives on
// <html data-theme>, set before the first paint by the root layout's inline
// script, and the choice is remembered in localStorage under "keda-theme".
// Nothing here is React state: the icons swap in CSS off the same attribute,
// so the server and the first client render always agree.
export const THEME_KEY = 'keda-theme';

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // storage blocked (private mode): the switch still works for this page
  }
}

export default function ThemeToggle({ label = 'Switch between dark and light', className = 'ic theme' }) {
  function toggle(e) {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduced) return setTheme(next);
    // the new theme is revealed in a circle growing out of the button
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = document.startViewTransition(() => setTheme(next));
    vt.ready
      .then(() =>
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
        )
      )
      .catch(() => {});
  }

  return (
    <button className={className} type="button" aria-label={label} title={label} onClick={toggle}>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
      </svg>
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </svg>
    </button>
  );
}
