import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500";

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-5 text-sm",
  lg: "h-14 rounded-2xl px-7 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-md hover:bg-primary-700 active:bg-primary-900",
  secondary:
    "bg-surface text-primary-700 border border-primary-200 hover:bg-primary-50 dark:text-primary-200 dark:border-primary-400/30 dark:hover:bg-primary-500/10",
  ghost: "bg-transparent text-text hover:bg-surface-2",
  outline:
    "bg-transparent text-text border border-border-strong hover:bg-surface-2",
};

type Common = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Common & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: Common & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href">) {
  const isExternal = /^https?:/.test(href);
  const cls = clsx(base, sizes[size], variants[variant], className);
  if (isExternal) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...(rest as Record<string, unknown>)}>
      {children}
    </Link>
  );
}
