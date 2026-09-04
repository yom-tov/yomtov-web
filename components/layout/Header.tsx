"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";

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
        <Link href="/" className="group flex items-center gap-3" aria-label="דף הבית — אבי יומטוביאן">
          <Image
            src="/images/mark.png"
            alt=""
            width={40}
            height={40}
            priority
            className="h-9 w-9 shrink-0 transition-transform group-hover:rotate-6"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-extrabold tracking-tight text-primary-900">
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
