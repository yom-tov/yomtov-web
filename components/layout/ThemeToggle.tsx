"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "yomtov-theme";

export function ThemeToggle({ variant = "full" }: { variant?: "full" | "icon" }) {
  // Start undefined-safe: read the class ThemeScript already applied to
  // <html> on first paint, so this never fights the inline script's choice.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {}
  };

  // Avoid a hydration mismatch: render the light-mode icon until mounted,
  // since server-rendered HTML has no knowledge of localStorage.
  const showDark = mounted && isDark;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={showDark ? "עבור למצב בהיר" : "עבור למצב כהה"}
        aria-pressed={showDark}
        className="inline-flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-2"
      >
        {showDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={showDark ? "עבור למצב בהיר" : "עבור למצב כהה"}
      aria-pressed={showDark}
      title={showDark ? "מצב בהיר" : "מצב כהה"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-white text-text-muted shadow-sm transition-colors hover:border-primary-400 hover:text-primary-600 dark:bg-surface dark:hover:bg-surface-2"
    >
      {showDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
