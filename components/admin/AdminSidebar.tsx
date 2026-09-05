"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, NotebookPen, Beaker, Palette, Settings, LogOut } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/admin", label: "לוח בקרה", icon: LayoutDashboard, exact: true },
  { href: "/admin/exams", label: "מבחנים", icon: FileText },
  { href: "/admin/assignments", label: "מטלות", icon: NotebookPen },
  { href: "/admin/labs", label: "מעבדות", icon: Beaker },
  { href: "/admin/subjects", label: "קטגוריות", icon: Palette },
  { href: "/admin/settings", label: "הגדרות", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-l md:border-border md:bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <Image src="/images/mark.png" alt="" width={36} height={36} className="h-9 w-9" />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-extrabold text-primary-900">אבי יומטוביאן</span>
          <span className="text-[11px] font-semibold text-accent-600">אדמין</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-800"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              )}
            >
              <Icon className={clsx("h-4 w-4", active && "text-primary-600")} />
              {label}
            </Link>
          );
        })}
      </nav>
      <form action="/admin/logout" method="post" className="border-t border-border p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-4 w-4" />
          התנתק
        </button>
      </form>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-surface/95 backdrop-blur">
      {ITEMS.slice(0, 5).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
              active ? "text-primary-700" : "text-text-subtle"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
