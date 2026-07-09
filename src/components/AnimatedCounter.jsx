import { useEffect, useRef } from 'react';

export default function AnimatedCounter({ value = 0, duration = 800, className = '' }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let start = null;
    const from = 0;
    const to = Number(value) || 0;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = Math.floor(from + (to - from) * progress);
      el.textContent = String(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = String(to);
      }
    };

    requestAnimationFrame(step);

    return () => {
      start = null;
    };
  }, [value, duration]);

  return <span ref={elRef} className={`stat-number ${className}`}>0</span>;
}
