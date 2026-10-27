'use client';

import { useEffect, useRef } from 'react';

// The hero's ground, interactive part only: the soft glow follows the
// pointer across the rings, the block faces drift against it at their own
// depth, and the call-to-action buttons lean toward the pointer. Everything
// inside is rendered by the server and passed in as children. Mouse and
// trackpad only, and nothing at all with reduced motion.
export default function HeroStage({ className = 'hero', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const hero = ref.current;
    if (!hero) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let last = null;
    const faces = () => hero.querySelectorAll('.face');
    function frame() {
      raf = 0;
      if (!last) return;
      const r = hero.getBoundingClientRect();
      const x = (last.clientX - r.left) / r.width - 0.5;
      const y = (last.clientY - r.top) / r.height - 0.5;
      faces().forEach((b) => {
        const d = Number(b.dataset.depth) || 1;
        b.style.transform = `translate3d(${x * -40 * d}px, ${y * -40 * d}px, 0)`;
      });
      hero.style.setProperty('--mx', `${last.clientX - r.left}px`);
      hero.style.setProperty('--my', `${last.clientY - r.top}px`);
    }
    function onMove(e) {
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function onLeave() {
      last = null;
      faces().forEach((b) => (b.style.transform = ''));
      hero.style.removeProperty('--mx');
      hero.style.removeProperty('--my');
    }
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);

    // magnetic buttons
    const mags = [...hero.querySelectorAll('.mag')];
    const onMagMove = (e) => {
      const b = e.currentTarget;
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
    };
    const onMagLeave = (e) => (e.currentTarget.style.translate = '');
    mags.forEach((b) => {
      b.addEventListener('pointermove', onMagMove);
      b.addEventListener('pointerleave', onMagLeave);
    });

    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      mags.forEach((b) => {
        b.removeEventListener('pointermove', onMagMove);
        b.removeEventListener('pointerleave', onMagLeave);
      });
    };
  }, []);

  return (
    <section className={className} ref={ref}>
      {children}
    </section>
  );
}
