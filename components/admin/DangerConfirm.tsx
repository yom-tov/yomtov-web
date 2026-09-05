"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

export function DangerConfirm({
  open,
  onClose,
  onConfirm,
  itemLabel,
  confirmText,
  title = "מחיקה - פעולה בלתי הפיכה",
  description = "פעולה זו תמחק את הפריט מהאתר ואת כל קובצי ה-PDF שלו מהריפו. אי אפשר לבטל.",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemLabel: string;
  confirmText: string; // user must type this exactly
  title?: string;
  description?: string;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const canConfirm = typed.trim() === confirmText && !busy;

  const handle = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">{title}</h3>
              <p className="mt-1 text-sm text-text-muted">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-subtle hover:bg-surface-2"
            aria-label="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3">
          <div className="text-xs text-text-muted">פריט למחיקה:</div>
          <div className="mt-1 font-mono text-sm text-text">{itemLabel}</div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold text-text-subtle">
            הקלד <span className="font-mono text-text">{confirmText}</span> כדי לאשר:
          </label>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm text-text focus:border-rose-500 focus:outline-none"
            autoFocus
          />
        </div>
        {err && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {err}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:bg-surface-2"
          >
            ביטול
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handle}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {busy ? "מוחק…" : "מחק"}
          </button>
        </div>
      </div>
    </div>
  );
}
