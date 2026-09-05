import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "default" | "primary" | "accent" | "success" | "warn" | "neutral";

const tones: Record<Tone, string> = {
  default: "bg-surface-2 text-text-muted border-border",
  primary:
    "bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-500/15 dark:text-primary-200 dark:border-primary-400/25",
  accent:
    "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/25",
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/25",
  warn:
    "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/25",
  neutral: "bg-white text-text border-border dark:bg-surface",
};

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium num",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
