"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { FileUpload, type UploadedFile } from "./FileUpload";
import { createExamAction, updateExamAction } from "@/app/admin/exams/actions";
import {
  examSlug,
  defaultExamTitle,
  SEASON_LABEL_HE,
  VERSION_LABEL_HE,
  SUBJECT_LABEL_HE,
  SOURCE_LABEL_HE,
} from "@/lib/admin/slug";
import type { Exam, SubjectId, ExamSource, Season, ExamVersion } from "@/types/content";

type Mode = "create" | "edit";

export function ExamForm({ mode, initial }: { mode: Mode; initial?: Exam }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [subject, setSubject] = useState<SubjectId>(initial?.subject ?? "electricity");
  const [source, setSource] = useState<ExamSource>(initial?.source ?? "mahat");
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : "");
  const [season, setSeason] = useState<Season>(initial?.season ?? null);
  const [version, setVersion] = useState<ExamVersion>(initial?.version ?? null);
  const [topic, setTopic] = useState<string>(initial?.topic ?? "");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [examFile, setExamFile] = useState<UploadedFile | null>(null);
  const [solutionFile, setSolutionFile] = useState<UploadedFile | null>(null);
  const [deleteSolution, setDeleteSolution] = useState(false);

  const yearNum = year ? Number(year) : null;

  // Auto-fill title when the user hasn't typed one and inputs change
  const autoTitle = useMemo(
    () => defaultExamTitle({ year: yearNum, season, version }),
    [yearNum, season, version]
  );
  const effectiveTitle = title.trim() || autoTitle;

  const previewSlug = examSlug({
    year: yearNum,
    season,
    version,
    title: effectiveTitle,
  });

  const canSubmit =
    !pending &&
    effectiveTitle.length > 0 &&
    (mode === "create" ? examFile !== null : true);

  const submit = () => {
    if (mode === "create" && !examFile) {
      toast.error("חסר קובץ מבחן");
      return;
    }
    startTransition(async () => {
      const commonBody = {
        subject,
        source,
        title: effectiveTitle,
        year: yearNum,
        season,
        version,
        topic: topic || null,
      } as const;

      const res =
        mode === "create"
          ? await createExamAction({
              ...commonBody,
              exam: examFile!,
              solution: solutionFile,
            })
          : await updateExamAction(initial!.id, {
              ...commonBody,
              exam: examFile ?? null,
              solution: solutionFile ?? null,
              deleteSolution,
            });

      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(
        mode === "create" ? "המבחן נשמר. פורסם תוך דקה." : "המבחן עודכן. פורסם תוך דקה.",
        {
          action: res.commitUrl
            ? {
                label: "commit",
                onClick: () => window.open(res.commitUrl, "_blank"),
              }
            : undefined,
        }
      );
      router.push("/admin/exams");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit();
      }}
      className="max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/admin/exams"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לרשימת המבחנים
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="תחום">
          <Select value={subject} onChange={(v) => setSubject(v as SubjectId)} disabled={mode === "edit"}>
            {(["electricity", "analog", "digital"] as const).map((s) => (
              <option key={s} value={s}>
                {SUBJECT_LABEL_HE[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="מקור">
          <Select value={source} onChange={(v) => setSource(v as ExamSource)} disabled={mode === "edit"}>
            {(["mahat", "education"] as const).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL_HE[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="שנה">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1990}
            max={new Date().getFullYear() + 2}
            className="input"
            placeholder="למשל 2025"
          />
        </Field>
        <Field label="מועד">
          <Select value={season ?? ""} onChange={(v) => setSeason((v || null) as Season)}>
            <option value="">-</option>
            {(["summer", "spring", "winter", "fall"] as const).map((s) => (
              <option key={s} value={s}>
                {SEASON_LABEL_HE[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="גרסה">
          <Select value={version ?? ""} onChange={(v) => setVersion((v || null) as ExamVersion)}>
            <option value="">-</option>
            {(["a", "b", "combined"] as const).map((v) => (
              <option key={v} value={v}>
                {VERSION_LABEL_HE[v]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="נושא (אופציונלי)">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input"
            placeholder="למשל: תורת החשמל DC"
          />
        </Field>
      </div>

      <Field label={`כותרת (ריק = "${autoTitle || "-"}" אוטומטית)`}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder={autoTitle || "כותרת חופשית"}
        />
      </Field>

      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
        <div className="text-xs text-text-subtle">
          Slug (URL) יווצר אוטומטית:{" "}
          <span className="font-mono text-text">{previewSlug || "-"}</span>
        </div>
        {mode === "edit" && (
          <div className="mt-1 text-xs text-rose-700">
            שינוי שנה/מועד/גרסה יגרום להתנגשות slug - לא נתמך בעדכון. מחק וצור מבחן חדש במקום.
          </div>
        )}
      </div>

      <FileUpload
        label={mode === "create" ? "קובץ המבחן (PDF)" : "קובץ מבחן חדש - החלפה (השאר ריק לשמירה על הקיים)"}
        value={examFile}
        onChange={setExamFile}
      />

      <div className="space-y-2">
        <FileUpload
          label={mode === "create" ? "קובץ פתרון (אופציונלי)" : "קובץ פתרון חדש (השאר ריק לשמירה)"}
          value={solutionFile}
          onChange={(f) => {
            setSolutionFile(f);
            if (f) setDeleteSolution(false);
          }}
        />
        {mode === "edit" && initial?.solution && !solutionFile && (
          <label className="inline-flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={deleteSolution}
              onChange={(e) => setDeleteSolution(e.target.checked)}
              className="h-3.5 w-3.5 accent-rose-600"
            />
            <span className={clsx(deleteSolution && "text-rose-700 font-semibold")}>
              מחק פתרון קיים
            </span>
          </label>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">
          שמירה תיצור commit חדש ותפרוס לפרודקשן תוך ~30-60 שניות.
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "שומר…" : mode === "create" ? "שמור מבחן" : "עדכן"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text);
          font-size: 14px;
        }
        .input:focus {
          outline: none;
          border-color: var(--primary-500);
        }
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

function Select({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none disabled:opacity-60"
    >
      {children}
    </select>
  );
}
