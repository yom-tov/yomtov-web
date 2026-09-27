"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";

export type StartStep = {
  title: string;
  text: string;
  links: { href: string; label: string }[];
};

/**
 * "How to start" timeline: a wire runs down the steps and fills with current
 * as you scroll; each step's LED lights up once the current reaches it.
 * Progress is written straight to CSS vars / data attributes — no re-renders.
 */
export function StartSteps({ steps }: { steps: StartStep[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-node]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.setProperty("--p", "1");
      for (const n of nodes) n.dataset.lit = "true";
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.6 - r.top) / r.height));
      root.style.setProperty("--p", p.toFixed(4));
      for (const n of nodes) {
        const nr = n.getBoundingClientRect();
        const at = (nr.top + nr.height / 2 - r.top) / r.height;
        n.dataset.lit = p >= at ? "true" : "false";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto max-w-3xl">
      <div aria-hidden className="absolute bottom-6 right-[22px] top-6 w-1 overflow-hidden rounded-full bg-border sm:right-[30px]">
        <div className="lp-wire-fill absolute inset-0 rounded-full bg-gradient-to-b from-accent-500 via-fuchsia-500 to-amber-500 shadow-[0_0_14px_rgba(6,182,212,0.8)]" />
      </div>
      <ol className="space-y-10 sm:space-y-14">
        {steps.map((s, i) => (
          <li key={s.title} className="relative pr-16 sm:pr-24">
            <span
              data-node
              aria-hidden
              className="lp-node absolute right-0 top-2 grid h-12 w-12 place-items-center rounded-full border-2 border-border bg-surface text-lg font-extrabold text-text-subtle sm:h-16 sm:w-16 sm:text-2xl"
            >
              {i + 1}
            </span>
            <div data-reveal="left" style={{ "--d": "80ms" } as React.CSSProperties}>
              <div className="lp-spot rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8" data-spot>
                <div className="text-xs font-bold text-accent-600 num">שלב {i + 1}</div>
                <h3 className="mt-1 text-xl font-extrabold text-text sm:text-2xl">{s.title}</h3>
                <p className="mt-2 text-base leading-7 text-text-muted">{s.text}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {s.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 text-sm font-semibold text-text transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:border-primary-400/40 dark:hover:bg-primary-500/10 dark:hover:text-primary-200"
                    >
                      {l.label}
                      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
