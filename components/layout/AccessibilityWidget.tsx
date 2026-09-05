"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Accessibility,
  X,
  Minus,
  Plus,
  Contrast,
  Link2,
  PauseCircle,
  Type,
  RotateCcw,
  FileText,
  Mail,
} from "lucide-react";
import { clsx } from "clsx";

const STORAGE_KEY = "yomtov-a11y";
const CONTACT_EMAIL = "yomtov7.site@gmail.com";

interface A11ySettings {
  fontSize: number; // 100 | 110 | 120 | 130 | 140
  highContrast: boolean;
  underlineLinks: boolean;
  stopAnimations: boolean;
  readableFont: boolean;
}

const DEFAULTS: A11ySettings = {
  fontSize: 100,
  highContrast: false,
  underlineLinks: false,
  stopAnimations: false,
  readableFont: false,
};

function applyToDom(s: A11ySettings) {
  const html = document.documentElement;
  if (s.fontSize !== 100) html.setAttribute("data-a11y-fontsize", String(s.fontSize));
  else html.removeAttribute("data-a11y-fontsize");

  if (s.highContrast) html.setAttribute("data-a11y-contrast", "high");
  else html.removeAttribute("data-a11y-contrast");

  if (s.underlineLinks) html.setAttribute("data-a11y-underline-links", "true");
  else html.removeAttribute("data-a11y-underline-links");

  if (s.stopAnimations) html.setAttribute("data-a11y-stop-animations", "true");
  else html.removeAttribute("data-a11y-stop-animations");

  if (s.readableFont) html.setAttribute("data-a11y-readable-font", "true");
  else html.removeAttribute("data-a11y-readable-font");
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<A11ySettings>(DEFAULTS);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Load persisted settings on mount (ties into what AccessibilityScript
  // already applied synchronously, so there's no visual jump).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  // Accepts either a plain patch or a function of the previous settings —
  // the latter is required for bumpFont below: computing the next font
  // step from the `settings` closure would go stale if two clicks land in
  // the same React batch (e.g. fast repeat clicks), silently swallowing one.
  const update = (
    patcher: Partial<A11ySettings> | ((prev: A11ySettings) => Partial<A11ySettings>)
  ) => {
    setSettings((prev) => {
      const patch = typeof patcher === "function" ? patcher(prev) : patcher;
      const next = { ...prev, ...patch };
      applyToDom(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const reset = () => update({ ...DEFAULTS });

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const bumpFont = (dir: 1 | -1) => {
    update((prev) => {
      const steps = [100, 110, 120, 130, 140];
      const idx = steps.indexOf(prev.fontSize);
      const nextIdx = Math.min(steps.length - 1, Math.max(0, (idx === -1 ? 0 : idx) + dir));
      return { fontSize: steps[nextIdx] };
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="פתח תפריט נגישות"
        className="fixed bottom-5 left-4 z-[60] grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary-700 to-primary-500 text-white shadow-lg transition-transform hover:scale-110 focus-visible:scale-110 sm:left-6"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-modal="false"
          aria-label="הגדרות נגישות"
          className="fixed bottom-20 left-4 z-[60] w-[calc(100vw-2rem)] max-w-xs rounded-2xl border border-border bg-surface p-4 shadow-2xl sm:left-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">התאמות נגישות</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור תפריט נגישות"
              className="rounded-lg p-1 text-text-subtle hover:bg-surface-2 hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Font size */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <Type className="h-3.5 w-3.5" />
              גודל טקסט
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => bumpFont(-1)}
                disabled={settings.fontSize <= 100}
                aria-label="הקטן טקסט"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-12 flex-1 text-center text-sm font-semibold text-text num">
                {settings.fontSize}%
              </span>
              <button
                type="button"
                onClick={() => bumpFont(1)}
                disabled={settings.fontSize >= 140}
                aria-label="הגדל טקסט"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-text-muted hover:bg-surface-2 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Toggles */}
          <div className="mt-4 space-y-1">
            <ToggleRow
              icon={<Contrast className="h-4 w-4" />}
              label="ניגודיות גבוהה"
              checked={settings.highContrast}
              onChange={(v) => update({ highContrast: v })}
            />
            <ToggleRow
              icon={<Link2 className="h-4 w-4" />}
              label="הדגשת קישורים"
              checked={settings.underlineLinks}
              onChange={(v) => update({ underlineLinks: v })}
            />
            <ToggleRow
              icon={<PauseCircle className="h-4 w-4" />}
              label="עצירת אנימציות"
              checked={settings.stopAnimations}
              onChange={(v) => update({ stopAnimations: v })}
            />
            <ToggleRow
              icon={<Type className="h-4 w-4" />}
              label="פונט קריא"
              checked={settings.readableFont}
              onChange={(v) => update({ readableFont: v })}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-muted hover:bg-surface-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            איפוס הגדרות
          </button>

          <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs">
            <Link
              href="/accessibility"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <FileText className="h-3.5 w-3.5" />
              הצהרת נגישות
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <Mail className="h-3.5 w-3.5" />
              דיווח על בעיית נגישות
            </a>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-text hover:bg-surface-2"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span
        aria-hidden
        className={clsx(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary-600" : "bg-surface-2 border border-border-strong"
        )}
      >
        {/* insetInlineStart (not a translateX) so the knob slides toward
            the correct physical edge under dir="rtl" without extra logic. */}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-[inset-inline-start] duration-200"
          style={{ insetInlineStart: checked ? "calc(100% - 1.125rem)" : "0.25rem" }}
        />
      </span>
    </button>
  );
}
