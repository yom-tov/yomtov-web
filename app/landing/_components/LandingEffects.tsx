"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide effects for /landing, wired up once instead of wrapping every
 * block in its own client component:
 *  - scroll reveal: flips data-inview="true" on [data-reveal] elements
 *  - rainbow scroll-progress bar pinned to the top of the viewport
 *  - cursor spotlight: writes --sx/--sy on the hovered [data-spot] card
 */
export function LandingEffects() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    let io: IntersectionObserver | null = null;
    if (reduce || !("IntersectionObserver" in window)) {
      for (const el of els) el.dataset.inview = "true";
    } else {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.inview = "true";
            io?.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
      );
      for (const el of els) io.observe(el);
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const onMove = (ev: PointerEvent) => {
      const target = ev.target as Element | null;
      const card = target?.closest?.<HTMLElement>("[data-spot]");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${ev.clientX - r.left}px`);
      card.style.setProperty("--sy", `${ev.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]">
      <div
        ref={barRef}
        className="rainbow-bar h-full origin-right shadow-[0_0_12px_rgba(217,70,239,0.6)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
