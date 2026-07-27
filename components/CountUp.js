'use client';

import { useEffect, useRef, useState } from 'react';

export default function CountUp({ target, duration = 900 }) {
  const ref = useRef(null);
  const started = useRef(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            io.unobserve(entry.target);
            if (target <= 0) {
              setValue(0);
              return;
            }
            const start = performance.now();
            function step(now) {
              const p = Math.min((now - start) / duration, 1);
              setValue(Math.floor(p * target));
              if (p < 1) requestAnimationFrame(step);
              else setValue(target);
            }
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <div className="num" ref={ref}>
      {value}
    </div>
  );
}
