"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Trash2 } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { deleteLabAction } from "./actions";
import type { Lab } from "@/types/content";

export function LabsListClient({ items }: { items: Lab[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Lab | null>(null);

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteLabAction(toDelete.id);
      if (res.ok) {
        toast.success("נמחק");
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2/40 p-10 text-center">
        <div className="text-sm font-semibold text-text">אין עדיין מעבדות במאגר</div>
        <Link
          href="/admin/labs/new"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          + הוסף את הראשונה
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>כותרת</Th>
              <Th>קבצים</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-surface-2/40">
                <Td>
                  <div className="font-semibold text-text">{l.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-subtle">{l.slug}</div>
                </Td>
                <Td className="num">{l.files.length}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/labs/${encodeURIComponent(l.id)}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> ערוך
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(l)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-rose-300 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> מחק
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
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
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-xs font-bold text-text-muted ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}
