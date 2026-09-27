"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the final number on the server (so it's correct without JS and
 * for crawlers), then — only if it starts below the fold — resets to 0 and
 * counts up the first time it scrolls into view. Writes straight to the DOM
 * so the animation doesn't re-render React 60 times a second.
 */
export function CountUp({
  value,
  duration = 1800,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;

    el.textContent = "0";
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (t: number) => {
          const k = Math.min(1, (t - start) / duration);
          const eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
          el.textContent = String(Math.round(value * eased));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={`num ${className ?? ""}`}>
      {value}
    </span>
  );
}
