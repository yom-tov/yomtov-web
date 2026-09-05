"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { updateSubjectAction } from "@/app/admin/subjects/actions";
import type { Subject } from "@/types/content";

const ICON_OPTIONS = ["Zap", "CircuitBoard", "Binary", "Beaker", "Calculator", "ClipboardCheck"] as const;

const COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "כתום → ורוד", value: "from-amber-500 via-orange-500 to-rose-500" },
  { label: "סגול → אינדיגו", value: "from-fuchsia-500 via-violet-500 to-indigo-500" },
  { label: "ירוק → תכלת", value: "from-emerald-500 via-teal-500 to-cyan-500" },
  { label: "כחול → ציאן", value: "from-blue-600 via-sky-500 to-cyan-500" },
  { label: "ורוד → סגול", value: "from-pink-500 via-fuchsia-500 to-purple-500" },
  { label: "כתום → צהוב", value: "from-orange-500 via-amber-500 to-yellow-400" },
];

export function SubjectForm({ initial }: { initial: Subject }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [hebrewTitle, setHebrewTitle] = useState(initial.hebrewTitle);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState<(typeof ICON_OPTIONS)[number]>(
    (ICON_OPTIONS as readonly string[]).includes(initial.icon) ? (initial.icon as (typeof ICON_OPTIONS)[number]) : "Zap"
  );
  const [color, setColor] = useState(initial.color);

  const submit = () => {
    startTransition(async () => {
      const res = await updateSubjectAction(initial.id, { hebrewTitle, description, icon, color });
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success("הקטגוריה עודכנה", {
        action: res.commitUrl ? { label: "commit", onClick: () => window.open(res.commitUrl, "_blank") } : undefined,
      });
      router.push("/admin/subjects");
      router.refresh();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="max-w-3xl space-y-6">
      <Link href="/admin/subjects" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> חזרה לרשימת הקטגוריות
      </Link>

      <Field label="כותרת עברית">
        <input value={hebrewTitle} onChange={(e) => setHebrewTitle(e.target.value)} required className="input" />
      </Field>

      <Field label="תיאור">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="input min-h-24 py-2"
        />
      </Field>

      <Field label="אייקון">
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                icon === i
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-border bg-white text-text-muted hover:border-primary-300"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Gradient (בחר preset או ערוך ידנית)">
        <div className="grid gap-2 sm:grid-cols-2">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setColor(p.value)}
              className={`flex items-center gap-3 rounded-xl border p-2 text-right ${
                color === p.value ? "border-primary-500 ring-2 ring-primary-200" : "border-border hover:border-primary-300"
              }`}
            >
              <span className={`h-8 w-16 rounded-lg bg-gradient-to-l ${p.value}`} />
              <span className="text-xs text-text-muted">{p.label}</span>
            </button>
          ))}
        </div>
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="input mt-2 font-mono text-xs"
          placeholder="from-*-500 via-*-500 to-*-500"
        />
      </Field>

      <div className="rounded-xl border border-border bg-surface-2/40 p-4">
        <div className="text-xs font-semibold text-text-subtle">תצוגה מקדימה</div>
        <div className="mt-3">
          <div className={`inline-flex items-center gap-3 rounded-2xl bg-gradient-to-l ${color} px-4 py-3 text-white shadow-md`}>
            <span className="font-bold">{hebrewTitle || "כותרת"}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">שמירה תיצור commit חדש ותפרוס לפרודקשן.</div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "שומר…" : "שמור"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%; height: 40px; padding: 0 12px;
          border-radius: 10px; border: 1px solid var(--border);
          background: white; color: var(--text); font-size: 14px;
        }
        .input:focus { outline: none; border-color: var(--primary-500); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}
