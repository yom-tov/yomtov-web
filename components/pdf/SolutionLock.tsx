"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Download, ExternalLink, Loader2, FileText } from "lucide-react";
import { formatSize } from "@/lib/content";

interface SolutionFile {
  label: string;
  path: string;
  sizeBytes: number | null;
}

export function SolutionLock({
  subject,
  slug,
  onPreview,
  activePreviewSrc,
}: {
  subject: string;
  slug: string;
  onPreview?: (path: string, label: string) => void;
  activePreviewSrc?: string;
}) {
  const [files, setFiles] = useState<SolutionFile[] | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/unlock-solution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, slug }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.files) setFiles(data.files);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [subject, slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/unlock-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, subject, slug }),
      });
      const data = await res.json();

      if (data.ok && data.files) {
        setFiles(data.files);
        setPassword("");
      } else if (data.error === "WRONG_PASSWORD") {
        setError("סיסמה שגויה, נסו שוב");
      } else if (data.error === "RATE_LIMITED") {
        setError(`יותר מדי ניסיונות. נסו שוב בעוד ${Math.ceil(data.retryIn / 60)} דקות`);
      } else {
        setError("שגיאה בשרת, נסו שוב מאוחר יותר");
      }
    } catch {
      setError("שגיאת תקשורת, נסו שוב");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          בודק גישה...
        </div>
      </div>
    );
  }

  if (files) {
    return (
      <>
        {files.map((f) => {
          const isActive = activePreviewSrc === f.path;
          return (
            <div
              key={f.path}
              onClick={() => onPreview?.(f.path, f.label)}
              className={`rounded-2xl border p-4 transition-all duration-200 ${
                onPreview ? "cursor-pointer" : ""
              } ${
                isActive
                  ? "border-primary-400 bg-primary-50/30 ring-2 ring-primary-200/60 dark:border-primary-500 dark:bg-primary-500/10 dark:ring-primary-500/20"
                  : "border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/10 hover:border-primary-200 dark:hover:border-primary-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-200"
                      : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                  }`}
                >
                  <Unlock className="h-4.5 w-4.5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  פתרון
                </span>
              </div>
              <div className="mt-3 text-sm font-semibold text-text">
                {f.label}
              </div>
              <div className="mt-1 text-xs text-text-subtle num">
                PDF · {formatSize(f.sizeBytes)}
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={f.path}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  הורדה
                </a>
                <a
                  href={f.path}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text hover:bg-surface-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  פתיחה
                </a>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
          <Lock className="h-4.5 w-4.5" />
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Lock className="h-3 w-3" />
          נעול
        </span>
      </div>
      <div className="mt-3 text-sm font-semibold text-text">
        הפתרון מוגן בסיסמה
      </div>
      <div className="mt-1 text-xs text-text-muted">
        הזינו את הסיסמה כדי לצפות בפתרון ולהוריד אותו
      </div>
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="הזינו סיסמה"
            dir="ltr"
            className="h-9 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-text placeholder:text-text-subtle focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:bg-surface-2 dark:focus:ring-primary-500/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unlock className="h-3.5 w-3.5" />
            )}
            פתיחה
          </button>
        </div>
        {error && (
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
