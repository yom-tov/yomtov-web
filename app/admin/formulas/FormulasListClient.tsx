"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, ExternalLink, Search, Sigma, Trash2 } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { HiddenToggle } from "@/components/admin/HiddenToggle";
import { DataTable, EmptyState, Input, LinkBtn, PageHeader, Select, THead, Td, Th, Tr } from "@/components/admin/ui/primitives";
import { SUBJECT_IDS, SUBJECT_LABEL_HE } from "@/lib/admin/slug";
import { getAssetUrl } from "@/lib/pdf-url";
import { deleteFormulaAction } from "./actions";
import type { Formula, SubjectId } from "@/types/content";

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FormulasListClient({ items }: { items: Formula[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<SubjectId | "">("");
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<Formula | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (f) => (!subject || f.subject === subject) && (!needle || `${f.title} ${f.slug}`.toLowerCase().includes(needle)),
    );
  }, [items, q, subject]);

  const doDelete = () => {
    if (!toDelete) return;
    start(async () => {
      const res = await deleteFormulaAction(toDelete.id);
      if (res.ok) {
        toast.success("נמחק — יוסר מהאתר תוך כדקה");
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={<Sigma className="h-5 w-5" />}
        title="נוסחאונים וסיכומים"
        description={`${items.length} נוסחאונים · מופיעים בדפי התחומים ובחיפוש`}
        actions={
          <LinkBtn href="/admin/formulas/new" variant="primary">
            + נוסחאון חדש
          </LinkBtn>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-border bg-surface p-3">
        <label className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש…" className="pr-9" />
        </label>
        <Select value={subject} onChange={(e) => setSubject(e.target.value as SubjectId | "")} className="w-auto">
          <option value="">כל התחומים</option>
          {SUBJECT_IDS.map((s) => (
            <option key={s} value={s}>
              {SUBJECT_LABEL_HE[s]}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="אין נוסחאונים להצגה" />
      ) : (
        <DataTable>
          <THead>
            <Th>כותרת</Th>
            <Th>תחום</Th>
            <Th>קובץ</Th>
            <Th className="w-0">פעולות</Th>
          </THead>
          <tbody>
            {filtered.map((f) => (
              <Tr key={f.id} muted={f.hidden}>
                <Td>
                  <div className="font-semibold text-text">{f.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-subtle">{f.slug}</div>
                </Td>
                <Td>{SUBJECT_LABEL_HE[f.subject]}</Td>
                <Td>
                  {f.files[0] && (
                    <a
                      href={getAssetUrl(f.files[0].path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-700 hover:underline dark:text-primary-200"
                    >
                      <ExternalLink className="h-3 w-3" />
                      PDF {formatSize(f.files[0].sizeBytes)}
                    </a>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <HiddenToggle kind="formula" id={f.id} hidden={!!f.hidden} compact />
                    <Link
                      href={`/admin/formulas/${encodeURIComponent(f.id)}/edit`}
                      prefetch={false}
                      className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                      aria-label="עריכה"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(f)}
                      disabled={pending}
                      className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      aria-label="מחק"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <DangerConfirm
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        itemLabel={toDelete ? `${toDelete.title} (${toDelete.slug})` : ""}
        confirmText={toDelete?.slug ?? ""}
      />
    </div>
  );
}
