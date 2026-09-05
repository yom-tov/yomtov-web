"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="group flex items-center gap-3" aria-label="דף הבית - אבי יומטוביאן">
          <Image
            src="/images/mark.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-9 w-9 shrink-0 will-change-transform transition-transform duration-500 ease-out group-hover:rotate-[35deg] group-hover:scale-115 group-hover:drop-shadow-[0_6px_18px_rgba(217,70,239,0.35)]"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-primary-900 dark:text-white">
              אבי יומטוביאן
            </span>
            <span className="text-[11px] font-semibold text-accent-600">
              פשוט להבין!
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex mx-auto items-center gap-1" aria-label="ראשי">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-110 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm hover:shadow-primary-500/15"
            >
              <span className="relative">
                {item.label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-1 right-0 left-0 mx-auto h-0.5 w-0 rounded-full bg-gradient-to-l from-primary-600 to-accent-500 transition-all duration-300 ease-out group-hover:w-full"
                />
              </span>
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2">
          <Link
            href="/search"
            className="hidden md:inline-flex items-center gap-2 rounded-lg border border-border-strong bg-white px-3 py-2 text-sm font-medium text-text-muted shadow-sm transition-colors hover:border-primary-400 hover:bg-primary-50/40 hover:text-text dark:bg-surface dark:hover:bg-surface-2"
          >
            <Search className="h-4 w-4 text-primary-500" />
            <span>חיפוש במאגר…</span>
          </Link>
          <ThemeToggle />
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

      {/* rainbow accent bar echoing the logo colors */}
      <div
        aria-hidden
        className="h-[3px] w-full bg-gradient-to-r from-rose-400 via-amber-400 via-emerald-400 via-cyan-400 via-indigo-400 to-fuchsia-400"
      />

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
