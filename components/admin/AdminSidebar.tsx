"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { clsx } from "clsx";
import { NAV_GROUPS, MOBILE_PRIMARY, isActive, type NavItem } from "./admin-nav";
import { useAlertSummary } from "./useAlertSummary";

function AlertCount({ compact }: { compact?: boolean }) {
  const summary = useAlertSummary();
  if (!summary) return null;
  const n = summary.critical + summary.warning;
  if (n === 0) return null;
  const tone = summary.critical > 0 ? "bg-rose-600" : "bg-amber-500";
  return (
    <span
      className={clsx(
        "num inline-grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold text-white",
        tone,
        compact ? "absolute -top-1 left-1/2 ml-2 h-4" : "h-5",
      )}
    >
      {n}
    </span>
  );
}

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onNavigate}
      className={clsx(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-50 text-primary-800 dark:bg-primary-500/15 dark:text-primary-100"
          : "text-text-muted hover:bg-surface-2 hover:text-text",
      )}
    >
      <Icon className={clsx("h-4 w-4 shrink-0", active && "text-primary-600 dark:text-primary-300")} />
      <span className="flex-1">{item.label}</span>
      {item.alerts && <AlertCount />}
    </Link>
  );
}

function NavGroups({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="mb-4 last:mb-0">
          <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-text-subtle">{group.title}</div>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image src="/images/mark.png" alt="" width={36} height={36} className="h-9 w-9" />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-extrabold text-primary-900 dark:text-text">אבי יומטוביאן</span>
        <span className="text-[11px] font-semibold text-accent-600">מרכז ניהול</span>
      </div>
    </div>
  );
}

function FooterLinks() {
  return (
    <div className="space-y-1 border-t border-border p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
      >
        <ExternalLink className="h-4 w-4" />
        צפה באתר
      </a>
      <form action="/admin/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </button>
      </form>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-l md:border-border md:bg-surface">
      <div className="border-b border-border px-5 py-4">
        <Brand />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <NavGroups pathname={pathname} />
      </nav>
      <FooterLinks />
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-surface/95 backdrop-blur md:hidden">
        {MOBILE_PRIMARY.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={clsx(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
                active ? "text-primary-700 dark:text-primary-200" : "text-text-subtle",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {item.alerts && <AlertCount compact />}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-text-subtle"
        >
          <Menu className="h-5 w-5" />
          עוד
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="תפריט ניהול">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="סגור תפריט"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface pb-6">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-5 py-3">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-text-muted hover:bg-surface-2"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3">
              <NavGroups pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <FooterLinks />
          </div>
        </div>
      )}
    </>
  );
}
