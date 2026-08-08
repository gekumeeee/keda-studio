'use client';

import { useEffect, useRef, useState } from 'react';

// Sibling to CountUp.js (which stays as-is for .about-stats' plain numeric
// targets) — this one parses admin-entered strings like "194+", "45%",
// "700M+" into a numeric part to animate plus a preserved prefix/suffix.
function parseStat(raw) {
  const str = String(raw ?? '').trim();
  const m = str.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!m) return { prefix: '', target: null, decimals: 0, suffix: str };
  const [, prefix, numStr, suffix] = m;
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
  return { prefix, target: parseFloat(numStr), decimals, suffix };
}

export default function StatCounter({ value, duration = 1100, className = 'num' }) {
  const { prefix, target, decimals, suffix } = parseStat(value);
  const ref = useRef(null);
  const started = useRef(false);
  const [display, setDisplay] = useState(prefix + (target === null ? '' : (0).toFixed(decimals)) + suffix);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === null) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            io.unobserve(entry.target);
            const start = performance.now();
            function step(now) {
              const p = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(prefix + (eased * target).toFixed(decimals) + suffix);
              if (p < 1) requestAnimationFrame(step);
              else setDisplay(prefix + target.toFixed(decimals) + suffix);
            }
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration, prefix, suffix, decimals]);

  return (
    <div className={className} ref={ref}>
      {target === null ? suffix : display}
    </div>
  );
}
