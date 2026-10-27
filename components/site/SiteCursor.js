'use client';

import { useEffect, useRef } from 'react';

const CLICKABLE = 'a, button, [role="button"], [role="tab"], label, summary, .pf-item';
const NATIVE = 'input, textarea, select, iframe, video, [contenteditable="true"]';

// A small, quiet custom cursor for the public site: an acid dot that sits
// exactly on the pointer and a thin ring that eases after it, growing softly
// over anything clickable. Only for a mouse or trackpad with motion allowed;
// on touch screens, coarse pointers or with reduced motion it never turns
// on and the normal cursor stays. Text fields keep the normal cursor too.
// Moves with transform only, one requestAnimationFrame loop that stops as
// soon as the ring has caught up.
export default function SiteCursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduced.matches) return;

    const d = dot.current;
    const r = ring.current;
    const html = document.documentElement;
    html.classList.add('cur-on');

    let x = -100, y = -100, rx = -100, ry = -100, raf = 0, shown = false;
    const place = (el, px, py) => (el.style.transform = `translate3d(${px}px, ${py}px, 0)`);

    function loop() {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      place(r, rx, ry);
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(loop);
      else raf = 0;
    }
    function show(on) {
      if (on === shown) return;
      shown = on;
      d.classList.toggle('on', on);
      r.classList.toggle('on', on);
    }
    function onMove(e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        rx = x;
        ry = y;
      }
      const t = e.target instanceof Element ? e.target : null;
      // over a text field (or an embedded player) the real cursor takes over
      show(!(t && t.closest(NATIVE)));
      r.classList.toggle('big', !!(t && t.closest(CLICKABLE)));
      place(d, x, y);
      if (!raf) raf = requestAnimationFrame(loop);
    }
    const hide = () => show(false);
    const onOut = (e) => !e.relatedTarget && hide();

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut);
    window.addEventListener('blur', hide);

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove('cur-on');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('blur', hide);
    };
  }, []);

  return (
    <>
      <div className="cur cur-ring" ref={ring} aria-hidden="true"><i /></div>
      <div className="cur cur-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
