"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import { extendAccessAction } from "../actions";

/** Inline "extend until…" control for one purchase. */
export function ExtendAccessButton({ purchaseId, expiresAt }: { purchaseId: string; expiresAt: Date | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(expiresAt ? new Date(expiresAt).toISOString().slice(0, 10) : "");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
      >
        <CalendarPlus className="h-3.5 w-3.5" /> {expiresAt ? "הארך" : "הגבל"}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs text-text"
      />
      <button
        type="button"
        disabled={!date || pending}
        onClick={() =>
          start(async () => {
            const res = await extendAccessAction(purchaseId, `${date}T23:59:59`);
            if (!res.ok) {
              toast.error(res.error ?? "שגיאה");
              return;
            }
            toast.success("תאריך התפוגה עודכן");
            setOpen(false);
            router.refresh();
          })
        }
        className="inline-flex h-8 items-center rounded-lg bg-primary-600 px-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "שמור"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-8 px-1 text-xs text-text-subtle">
        ביטול
      </button>
    </div>
  );
}
