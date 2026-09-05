"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Trash2, Plus, Search, X } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { deleteExamAction } from "./actions";
import type { Exam, SubjectId, ExamSource } from "@/types/content";
import { SUBJECT_LABEL_HE, SOURCE_LABEL_HE, SEASON_LABEL_HE, VERSION_LABEL_HE } from "@/lib/admin/slug";

export function ExamsListClient({ items }: { items: Exam[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [source, setSource] = useState<ExamSource | "">("");
  const [year, setYear] = useState<string>("");
  const [hasSolution, setHasSolution] = useState<"" | "yes" | "no">("");
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Exam | null>(null);

  const years = useMemo(
    () => Array.from(new Set(items.map((e) => e.year).filter((y): y is number => y != null))).sort((a, b) => b - a),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((e) => {
      if (subject && e.subject !== subject) return false;
      if (source && e.source !== source) return false;
      if (year && String(e.year) !== year) return false;
      if (hasSolution === "yes" && !e.solution) return false;
      if (hasSolution === "no" && e.solution) return false;
      if (needle) {
        const hay = `${e.title} ${e.slug} ${e.topic ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, q, subject, source, year, hasSolution]);

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteExamAction(toDelete.id);
      if (res.ok) {
        toast.success("נמחק. פרסום תוך דקה.");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "מחיקה נכשלה");
      }
    });
  };

  const clearFilters = () => {
    setQ("");
    setSubject("");
    setSource("");
    setYear("");
    setHasSolution("");
  };
  const activeFilters =
    Number(!!q) + Number(!!subject) + Number(!!source) + Number(!!year) + Number(!!hasSolution);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">מבחנים</h1>
          <p className="text-sm text-text-muted num">
            {filtered.length} מוצגים · {items.length} סה״כ
          </p>
        </div>
        <Link
          href="/admin/exams/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          מבחן חדש
        </Link>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-surface p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 focus-within:border-primary-500">
              <Search className="h-4 w-4 text-text-subtle" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="חיפוש בכותרת / slug / נושא"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
              />
            </label>
          </div>
          <F label="תחום">
            <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | "")} className="select">
              <option value="">הכל</option>
              {(["electricity", "analog", "digital"] as const).map((s) => (
                <option key={s} value={s}>
                  {SUBJECT_LABEL_HE[s]}
                </option>
              ))}
            </select>
          </F>
          <F label="מקור">
            <select value={source} onChange={(e) => setSource(e.target.value as ExamSource | "")} className="select">
              <option value="">הכל</option>
              {(["mahat", "education"] as const).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL_HE[s]}
                </option>
              ))}
            </select>
          </F>
          <F label="שנה">
            <select value={year} onChange={(e) => setYear(e.target.value)} className="select">
              <option value="">הכל</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </F>
          <F label="פתרון">
            <select
              value={hasSolution}
              onChange={(e) => setHasSolution(e.target.value as "" | "yes" | "no")}
              className="select"
            >
              <option value="">הכל</option>
              <option value="yes">עם פתרון</option>
              <option value="no">בלי פתרון</option>
            </select>
          </F>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-muted hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
              נקה ({activeFilters})
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>כותרת</Th>
              <Th>תחום</Th>
              <Th>מקור</Th>
              <Th>שנה</Th>
              <Th>מועד/גרסה</Th>
              <Th>פתרון</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t border-border hover:bg-surface-2/40">
                <Td>
                  <div className="font-semibold text-text">{e.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-subtle">{e.slug}</div>
                </Td>
                <Td>{SUBJECT_LABEL_HE[e.subject]}</Td>
                <Td>{SOURCE_LABEL_HE[e.source]}</Td>
                <Td className="num">{e.year ?? "-"}</Td>
                <Td>
                  {[e.season && SEASON_LABEL_HE[e.season], e.version && VERSION_LABEL_HE[e.version]]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </Td>
                <Td>{e.solution ? "✓" : "-"}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/exams/${encodeURIComponent(e.id)}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> ערוך
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(e)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-rose-300 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> מחק
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-text-subtle">
                  אין תוצאות
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DangerConfirm
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        itemLabel={toDelete ? `${toDelete.title} (${toDelete.slug})` : ""}
        confirmText={toDelete?.slug ?? ""}
      />

      <style jsx>{`
        .select {
          height: 36px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text);
          font-size: 13px;
        }
        .select:focus {
          outline: none;
          border-color: var(--primary-500);
        }
      `}</style>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-bold text-text-muted ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}
