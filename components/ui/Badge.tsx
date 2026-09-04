import { clsx } from "clsx";
import type { ReactNode } from "react";

type Tone = "default" | "primary" | "accent" | "success" | "warn" | "neutral";

const tones: Record<Tone, string> = {
  default: "bg-surface-2 text-text-muted border-border",
  primary: "bg-primary-50 text-primary-700 border-primary-100",
  accent: "bg-cyan-50 text-cyan-700 border-cyan-100",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warn: "bg-amber-50 text-amber-700 border-amber-100",
  neutral: "bg-white text-text border-border",
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
