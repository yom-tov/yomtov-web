"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Plus, Trash } from "lucide-react";
import { FileUpload, type UploadedFile } from "./FileUpload";
import { createLabAction, updateLabAction } from "@/app/admin/labs/actions";
import type { Lab } from "@/types/content";

type Mode = "create" | "edit";

export function LabForm({ mode, initial }: { mode: Mode; initial?: Lab }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [files, setFiles] = useState<(UploadedFile | null)[]>([null]);
  const [keepExistingFiles, setKeepExistingFiles] = useState(true);

  const submit = () => {
    startTransition(async () => {
      const chosen = files.filter((f): f is UploadedFile => f !== null);
      const res =
        mode === "create"
          ? await createLabAction({ slug, title, description: description || undefined, files: chosen })
          : await updateLabAction(initial!.id, {
              title,
              description: description || undefined,
              files: chosen.length ? chosen : undefined,
              keepExistingFiles,
            });
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(mode === "create" ? "המעבדה נשמרה" : "המעבדה עודכנה", {
        action: res.commitUrl ? { label: "commit", onClick: () => window.open(res.commitUrl, "_blank") } : undefined,
      });
      router.push("/admin/labs");
      router.refresh();
    });
  };

  const setFileAt = (idx: number, v: UploadedFile | null) => setFiles((prev) => prev.map((x, i) => (i === idx ? v : x)));
  const addSlot = () => setFiles((prev) => [...prev, null]);
  const removeSlot = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="max-w-3xl space-y-6">
      <Link href="/admin/labs" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> חזרה לרשימת המעבדות
      </Link>

      {mode === "create" && (
        <Field label="Slug (לדוגמה dc-basics)">
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="input font-mono" placeholder="a-z 0-9 -" />
        </Field>
      )}

      <Field label="כותרת">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
      </Field>

      <Field label="תיאור (אופציונלי)">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input min-h-24 py-2" />
      </Field>

      <div className="space-y-3">
        {mode === "edit" && initial?.files?.length ? (
          <label className="inline-flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={keepExistingFiles}
              onChange={(e) => setKeepExistingFiles(e.target.checked)}
              className="h-3.5 w-3.5 accent-primary-600"
            />
            שמור {initial.files.length} קבצים קיימים
          </label>
        ) : null}

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
              <button type="button" onClick={() => removeSlot(i)} className="mt-6 rounded-lg border border-border bg-white p-2 text-text-muted hover:border-rose-300 hover:text-rose-700">
                <Trash className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {files.length < 6 && (
          <button type="button" onClick={addSlot} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700">
            <Plus className="h-3.5 w-3.5" /> הוסף קובץ
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">שמירה תפרוס לפרודקשן תוך ~30-60 שניות.</div>
        <button
          type="submit"
          disabled={pending || !title || (mode === "create" && !files.some(Boolean))}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "שומר…" : mode === "create" ? "שמור מעבדה" : "עדכן"}
        </button>
      </div>

      <style jsx>{`
        .input { width: 100%; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--border); background: white; color: var(--text); font-size: 14px; }
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
