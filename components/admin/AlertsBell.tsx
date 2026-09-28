"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCircle2, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { clsx } from "clsx";
import { useAlertSummary, type AlertItem } from "./useAlertSummary";

const SEVERITY_ICON: Record<AlertItem["severity"], React.ReactNode> = {
  critical: <AlertOctagon className="h-4 w-4 text-rose-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-sky-500" />,
};

export function AlertsBell() {
  const summary = useAlertSummary();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = summary ? summary.critical + summary.warning : 0;
  const hasCritical = (summary?.critical ?? 0) > 0;
  const Icon = count > 0 ? BellRing : Bell;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={count > 0 ? `${count} התראות פתוחות` : "התראות"}
        aria-expanded={open}
        className={clsx(
          "relative grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface transition-colors hover:bg-surface-2",
          hasCritical ? "text-rose-600" : count > 0 ? "text-amber-600" : "text-text-muted",
        )}
      >
        <Icon className="h-4.5 w-4.5" />
        {count > 0 && (
          <span
            className={clsx(
              "num absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white",
              hasCritical ? "bg-rose-600" : "bg-amber-500",
            )}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold text-text">התראות</span>
            {summary?.lastRunAt && (
              <span className="text-[10px] text-text-subtle">
                נבדק {new Date(summary.lastRunAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!summary ? (
              <div className="px-4 py-6 text-center text-xs text-text-subtle">טוען…</div>
            ) : summary.alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                <div className="text-sm font-semibold text-text">הכל תקין</div>
                <div className="text-xs text-text-subtle">אין התראות פתוחות</div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {summary.alerts.slice(0, 8).map((a) => (
                  <li key={a.id} className={clsx("flex gap-3 px-4 py-3", a.acknowledgedAt && "opacity-60")}>
                    <div className="mt-0.5 shrink-0">{SEVERITY_ICON[a.severity]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-text">{a.title}</div>
                      {a.detail && <div className="mt-0.5 line-clamp-2 text-[11px] text-text-muted">{a.detail}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/admin/health"
            prefetch={false}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-primary-700 hover:bg-surface-2 dark:text-primary-200"
          >
            למצב המערכת המלא ←
          </Link>
        </div>
      )}
    </div>
  );
}
