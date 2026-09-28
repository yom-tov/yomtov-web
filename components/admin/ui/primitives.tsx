// Presentational building blocks for the admin panel. No hooks here, so these
// work in both server and client components. Interactive pieces live in
// ./interactive.tsx.

import Link from "next/link";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

// ---------------------------------------------------------------------------
// Tones shared by badges, dots and banners
// ---------------------------------------------------------------------------
export type Tone = "neutral" | "primary" | "success" | "warn" | "danger" | "info";

const BADGE_TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text-muted border-border",
  primary: "bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-500/15 dark:text-primary-200 dark:border-primary-500/30",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  warn: "bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  danger: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
  info: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status dot — health of a service / check
// ---------------------------------------------------------------------------
export type Status = "ok" | "warn" | "error" | "unknown";

const DOT: Record<Status, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-rose-500",
  unknown: "bg-slate-400",
};

export const STATUS_LABEL_HE: Record<Status, string> = {
  ok: "תקין",
  warn: "דורש תשומת לב",
  error: "תקלה",
  unknown: "לא ידוע",
};

export function StatusDot({
  status,
  pulse,
  className,
}: {
  status: Status;
  pulse?: boolean;
  className?: string;
}) {
  const animate = pulse ?? status === "error";
  return (
    <span className={clsx("relative inline-flex h-2.5 w-2.5 shrink-0", className)} aria-label={STATUS_LABEL_HE[status]}>
      {animate && <span className={clsx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", DOT[status])} />}
      <span className={clsx("relative inline-flex h-2.5 w-2.5 rounded-full", DOT[status])} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  icon,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          prefetch={false}
          className="mb-3 inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700 dark:hover:text-primary-200"
        >
          <ArrowRight className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-200">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-text">{title}</h1>
            {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  description,
  icon,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={clsx("rounded-2xl border border-border bg-surface", padded && "p-5", className)}>
      {(title || actions) && (
        <div className={clsx("flex flex-wrap items-start justify-between gap-2", children ? "mb-4" : "", !padded && "px-5 pt-5")}>
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 text-sm font-bold text-text">
                {icon}
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-xs text-text-subtle">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  href?: string;
}) {
  const body = (
    <div className="h-full rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      {icon && <div className="flex items-center gap-2">{icon}</div>}
      <div className="num mt-2 text-3xl font-extrabold text-text">{value}</div>
      <div className="text-xs font-semibold text-text-muted">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-text-subtle">{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} prefetch={false} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      {icon && <div className="mb-3 text-text-subtle">{icon}</div>}
      <div className="text-sm font-bold text-text">{title}</div>
      {description && <div className="mt-1 max-w-md text-xs text-text-muted">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Banner({
  tone = "info",
  icon,
  title,
  children,
  action,
}: {
  tone?: Exclude<Tone, "neutral" | "primary">;
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-wrap items-start gap-3 rounded-2xl border p-4", BADGE_TONES[tone])}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{title}</div>
        {children && <div className="mt-1 text-xs opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md";

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500";
const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 rounded-lg px-2.5 text-xs",
  md: "h-10 rounded-xl px-4 text-sm",
};
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
  secondary: "border border-border bg-surface text-text hover:bg-surface-2",
  ghost: "text-text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
};

export function btnClass(variant: BtnVariant = "secondary", size: BtnSize = "md", className?: string) {
  return clsx(BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], className);
}

export function Btn({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: { variant?: BtnVariant; size?: BtnSize } & ComponentPropsWithoutRef<"button">) {
  return <button type={type} className={btnClass(variant, size, className)} {...rest} />;
}

export function LinkBtn({
  variant = "secondary",
  size = "md",
  className,
  href,
  external,
  children,
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass(variant, size, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={false} className={btnClass(variant, size, className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("flex flex-col gap-1", className)}>
      <span className="text-xs font-semibold text-text-subtle">{label}</span>
      {children}
      {error ? (
        <span className="text-[11px] font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...rest }: ComponentPropsWithoutRef<"input">) {
  return <input className={clsx("admin-input", className)} {...rest} />;
}

export function Textarea({ className, rows = 3, ...rest }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea rows={rows} className={clsx("admin-input", className)} {...rest} />;
}

export function Select({ className, ...rest }: ComponentPropsWithoutRef<"select">) {
  return <select className={clsx("admin-input", className)} {...rest} />;
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-x-auto rounded-2xl border border-border bg-surface", className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-2/60 text-right">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={clsx("px-3 py-2.5 text-xs font-bold text-text-muted", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={clsx("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

export function Tr({ children, className, muted }: { children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <tr className={clsx("border-b border-border last:border-0 hover:bg-surface-2/40", muted && "opacity-55", className)}>
      {children}
    </tr>
  );
}
