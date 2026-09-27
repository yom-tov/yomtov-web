"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A search box that types, holds, and erases a list of real queries. */
export function TypingSearch({
  words,
  onWord,
}: {
  words: string[];
  onWord?: (word: string) => void;
}) {
  const [text, setText] = useState(words[0] ?? "");

  useEffect(() => {
    if (prefersReducedMotion() || words.length === 0) {
      onWord?.(words[0] ?? "");
      return;
    }
    let wordIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      const word = words[wordIdx];
      if (!deleting) {
        charIdx++;
        setText(word.slice(0, charIdx));
        if (charIdx === word.length) {
          onWord?.(word);
          deleting = true;
          timer = setTimeout(step, 2200);
          return;
        }
        timer = setTimeout(step, 90);
      } else {
        charIdx--;
        setText(word.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          wordIdx = (wordIdx + 1) % words.length;
          timer = setTimeout(step, 350);
          return;
        }
        timer = setTimeout(step, 35);
      }
    };
    timer = setTimeout(() => {
      setText("");
      step();
    }, 600);
    return () => clearTimeout(timer);
    // `onWord` is intentionally excluded: callers pass inline setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  return (
    <span>
      {text}
      <span aria-hidden className="lp-caret" />
    </span>
  );
}

/** Cycles calculator readouts on an LED display (reuses .led-display). */
export function LedTicker({
  items,
}: {
  items: { expr: string; value: string; color: "amber" | "emerald" | "cyan" | "fuchsia" }[];
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setI((n) => (n + 1) % items.length), 2400);
    return () => clearInterval(id);
  }, [items.length]);

  const item = items[i];
  return (
    <div
      className="led-display rounded-xl px-4 py-3 text-left transition-colors duration-500"
      data-color={item.color}
      dir="ltr"
    >
      <div key={`e${i}`} className="text-xs opacity-70 lp-rise">
        {item.expr}
      </div>
      <div key={`v${i}`} className="mt-1 text-2xl font-bold lp-rise" style={{ "--d": "80ms" } as React.CSSProperties}>
        {item.value}
      </div>
    </div>
  );
}
