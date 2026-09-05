"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Plus, Trash } from "lucide-react";
import { FileUpload, type UploadedFile } from "./FileUpload";
import { createAssignmentAction, updateAssignmentAction } from "@/app/admin/assignments/actions";
import { assignmentSlug, SUBJECT_LABEL_HE } from "@/lib/admin/slug";
import type { Assignment, SubjectId } from "@/types/content";

type Mode = "create" | "edit";

export function AssignmentForm({ mode, initial }: { mode: Mode; initial?: Assignment }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [subject, setSubject] = useState<SubjectId>(initial?.subject ?? "electricity");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [files, setFiles] = useState<(UploadedFile | null)[]>([null]);
  const [keepExistingFiles, setKeepExistingFiles] = useState(true);

  const previewSlug =
    mode === "edit"
      ? initial!.slug
      : slug.trim() || assignmentSlug({ englishHint: null, title: title || "item" });

  const submit = () => {
    startTransition(async () => {
      const chosen = files.filter((f): f is UploadedFile => f !== null);
      const res =
        mode === "create"
          ? await createAssignmentAction({
              subject,
              title,
              topic: topic || null,
              slug: slug.trim() || undefined,
              files: chosen,
            })
          : await updateAssignmentAction(initial!.id, {
              subject,
              title,
              topic: topic || null,
              files: chosen.length ? chosen : undefined,
              keepExistingFiles,
            });
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(mode === "create" ? "המטלה נשמרה" : "המטלה עודכנה", {
        action: res.commitUrl ? { label: "commit", onClick: () => window.open(res.commitUrl, "_blank") } : undefined,
      });
      router.push("/admin/assignments");
      router.refresh();
    });
  };

  const setFileAt = (idx: number, v: UploadedFile | null) => {
    setFiles((prev) => prev.map((x, i) => (i === idx ? v : x)));
  };
  const addSlot = () => setFiles((prev) => [...prev, null]);
  const removeSlot = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="max-w-3xl space-y-6">
      <Link href="/admin/assignments" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> חזרה לרשימת המטלות
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תחום">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectId)}
            disabled={mode === "edit"}
            className="input"
          >
            {(["electricity", "analog", "digital"] as const).map((s) => (
              <option key={s} value={s}>{SUBJECT_LABEL_HE[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="נושא (אופציונלי)">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="כותרת">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" placeholder="למשל: דיודות - בסיסי" />
      </Field>

      {mode === "create" && (
        <Field label="Slug ידני (ריק = יווצר אוטומטית מהכותרת)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="input font-mono" placeholder="למשל: diodes-basics" />
        </Field>
      )}

      <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-xs text-text-subtle">
        Slug: <span className="font-mono text-text">{previewSlug}</span>
      </div>

      <div className="space-y-3">
        {mode === "edit" && initial?.files && initial.files.length > 0 && (
          <label className="inline-flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={keepExistingFiles}
              onChange={(e) => setKeepExistingFiles(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary-600"
            />
            שמור {initial.files.length} קבצים קיימים (הסר סימון כדי להחליף הכל)
          </label>
        )}

        {files.map((f, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <FileUpload
                label={`קובץ ${i + 1}${i === 0 && mode === "create" ? " (חובה)" : " (אופציונלי)"}`}
                value={f}
                onChange={(v) => setFileAt(i, v)}
              />
            </div>
            {files.length > 1 && (
              <button
                type="button"
                onClick={() => removeSlot(i)}
                aria-label="הסר משבצת"
                className="mt-6 rounded-lg border border-border bg-white p-2 text-text-muted hover:border-rose-300 hover:text-rose-700"
              >
                <Trash className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {files.length < 6 && (
          <button
            type="button"
            onClick={addSlot}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> הוסף קובץ
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">
          שמירה תיצור commit חדש ותפרוס לפרודקשן תוך ~30-60 שניות.
        </div>
        <button
          type="submit"
          disabled={pending || !title || (mode === "create" && !files.some(Boolean))}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "שומר…" : mode === "create" ? "שמור מטלה" : "עדכן"}
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
