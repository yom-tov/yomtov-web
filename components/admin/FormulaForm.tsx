"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { FileUpload, type UploadedFile } from "./FileUpload";
import { Btn, Field, Input, Select } from "./ui/primitives";
import { createFormulaAction, updateFormulaAction } from "@/app/admin/formulas/actions";
import { assignmentSlug, SUBJECT_IDS, SUBJECT_LABEL_HE } from "@/lib/admin/slug";
import { getAssetUrl } from "@/lib/pdf-url";
import type { Formula, SubjectId } from "@/types/content";

export function FormulaForm({ mode, initial }: { mode: "create" | "edit"; initial?: Formula }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState<SubjectId>(initial?.subject ?? "electricity");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<UploadedFile | null>(null);

  const previewSlug = mode === "edit" ? initial!.slug : slug.trim() || assignmentSlug({ englishHint: null, title: title || "item" });
  const canSubmit = !pending && title.trim() && (mode === "edit" || file);

  const submit = () =>
    start(async () => {
      const res =
        mode === "create"
          ? await createFormulaAction({ subject, title, slug: slug.trim() || undefined, file: file! })
          : await updateFormulaAction(initial!.id, { title, file });
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(mode === "create" ? "הנוסחאון נשמר — יופיע באתר תוך כדקה" : "עודכן — יופיע באתר תוך כדקה");
      router.push("/admin/formulas");
      router.refresh();
    });

  const current = initial?.files[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5 rounded-2xl border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תחום" hint={mode === "edit" ? "לא ניתן לשנות תחום לנוסחאון קיים" : undefined}>
          <Select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId)} disabled={mode === "edit"}>
            {SUBJECT_IDS.map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABEL_HE[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="כותרת">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="למשל: נוסחאון חשמל מה״ט" />
        </Field>
      </div>

      {mode === "create" && (
        <Field label="כתובת באנגלית (לא חובה)" hint="ריק = תיווצר אוטומטית. אותיות קטנות, מספרים ומקפים.">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" className="font-mono" placeholder="formula-sheet-2025" />
        </Field>
      )}
      <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-text-subtle">
        הכתובת באתר:{" "}
        <span className="font-mono text-text" dir="ltr">
          /{subject}/formulas/{previewSlug}
        </span>
      </div>

      {mode === "edit" && current && (
        <a
          href={getAssetUrl(current.path)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          הקובץ הנוכחי
        </a>
      )}

      <FileUpload
        label={mode === "create" ? "קובץ PDF (חובה)" : "החלפת הקובץ (לא חובה)"}
        value={file}
        onChange={setFile}
      />

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-text-subtle">השמירה מעדכנת את האתר תוך כדקה.</span>
        <Btn type="submit" variant="primary" disabled={!canSubmit}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "שומר…" : mode === "create" ? "שמור נוסחאון" : "עדכן"}
        </Btn>
      </div>
    </form>
  );
}
