"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, X, Zap } from "lucide-react";

const NAV = [
  { href: "/electricity", label: "חשמל" },
  { href: "/analog", label: "אלקטרוניקה תקבילית" },
  { href: "/digital", label: "אלקטרוניקה ספרתית" },
  { href: "/labs", label: "מעבדות" },
  { href: "/calculator", label: "מחשבון" },
  { href: "/exams", label: "מבחנים" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary-900 text-accent-400 shadow-md transition-transform group-hover:scale-105"
          >
            <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-primary-900">
              יומטוב
            </span>
            <span className="text-[11px] font-medium text-text-subtle">
              e-tv learning platform
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex mx-auto items-center gap-1" aria-label="ראשי">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-2 hover:text-primary-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2">
          <Link
            href="/search"
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2/60 px-3 py-2 text-sm text-text-subtle transition-colors hover:border-border-strong hover:text-text"
          >
            <Search className="h-4 w-4" />
            <span>חיפוש במאגר…</span>
          </Link>
          <Link
            href="/search"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-2"
            aria-label="חיפוש"
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-2"
            aria-label="פתח תפריט"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="container-page flex flex-col py-2" aria-label="תפריט נייד">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-text-muted hover:bg-surface-2 hover:text-primary-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
