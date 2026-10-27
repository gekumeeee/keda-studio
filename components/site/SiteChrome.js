'use client';

import { useEffect, useRef } from 'react';
import SiteCursor from './SiteCursor';

const EDITABLE = 'input, textarea, select, [contenteditable="true"]';

// Wraps every public page with three page-wide behaviours:
//  - scroll reveal: anything marked .rv fades up the first time it's seen
//    (one observer for the page instead of a client component per block);
//  - content protection: no right-click menu or dragging on images, no
//    copying or cutting page text. Form fields are left alone, so the
//    contact form still takes typing, selection and paste. This is a
//    deterrent only: anyone determined can still screenshot the page or
//    read the image addresses from the page source.
//  - the custom cursor.
// The admin is outside this component, so none of it applies there.
export default function SiteChrome({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // ---- reveal ----
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    const watch = (scope) =>
      scope.querySelectorAll?.('.rv:not(.in)').forEach((el) => (reduced ? el.classList.add('in') : io.observe(el)));
    watch(root);
    // blocks that arrive later (a filter, a language switch) get watched too
    const mo = new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches('.rv:not(.in)') ? io.observe(n) : watch(n)))));
    mo.observe(root, { childList: true, subtree: true });

    // ---- protection ----
    const isEditable = (el) => el instanceof Element && el.closest(EDITABLE);
    function onMenu(e) {
      if (e.target instanceof Element && e.target.closest('img, video, picture, .pf-item, .fan-card, .cl, svg')) e.preventDefault();
    }
    function onDrag(e) {
      if (e.target instanceof Element && e.target.closest('img, a')) e.preventDefault();
    }
    function onCopy(e) {
      if (!isEditable(e.target) && !isEditable(document.activeElement)) e.preventDefault();
    }
    root.addEventListener('contextmenu', onMenu);
    root.addEventListener('dragstart', onDrag);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);

    return () => {
      io.disconnect();
      mo.disconnect();
      root.removeEventListener('contextmenu', onMenu);
      root.removeEventListener('dragstart', onDrag);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
    };
  }, []);

  return (
    <div className="guard" ref={ref}>
      {children}
      <SiteCursor />
    </div>
  );
}
