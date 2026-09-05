"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Trash2, Plus, Search, X } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { deleteAssignmentAction } from "./actions";
import type { Assignment, SubjectId } from "@/types/content";
import { SUBJECT_LABEL_HE } from "@/lib/admin/slug";

export function AssignmentsListClient({ items }: { items: Assignment[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Assignment | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((a) => {
      if (subject && a.subject !== subject) return false;
      if (needle && !(`${a.title} ${a.slug} ${a.topic ?? ""}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [items, q, subject]);

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteAssignmentAction(toDelete.id);
      if (res.ok) {
        toast.success("נמחק");
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">מטלות</h1>
          <p className="text-sm text-text-muted num">{filtered.length} מוצגים · {items.length} סה״כ</p>
        </div>
        <Link
          href="/admin/assignments/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus className="h-4 w-4" /> מטלה חדשה
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
                placeholder="חיפוש בכותרת / slug"
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-text-subtle">תחום</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | "")} className="select">
              <option value="">הכל</option>
              {(["electricity", "analog", "digital"] as const).map((s) => (
                <option key={s} value={s}>{SUBJECT_LABEL_HE[s]}</option>
              ))}
            </select>
          </label>
          {(q || subject) && (
            <button type="button" onClick={() => { setQ(""); setSubject(""); }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs text-text-muted hover:text-text">
              <X className="h-3.5 w-3.5" /> נקה
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>כותרת</Th>
              <Th>תחום</Th>
              <Th>קבצים</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-border hover:bg-surface-2/40">
                <Td>
                  <div className="font-semibold text-text">{a.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-subtle">{a.slug}</div>
                </Td>
                <Td>{SUBJECT_LABEL_HE[a.subject]}</Td>
                <Td className="num">{a.files.length}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/assignments/${encodeURIComponent(a.id)}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> ערוך
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(a)}
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
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-subtle">אין תוצאות</td>
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
          height: 36px; padding: 0 10px; border-radius: 8px;
          border: 1px solid var(--border); background: white;
          color: var(--text); font-size: 13px;
        }
        .select:focus { outline: none; border-color: var(--primary-500); }
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
