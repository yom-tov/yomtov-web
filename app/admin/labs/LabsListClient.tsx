"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Loader2, Save, Trash2, Undo2 } from "lucide-react";
import { clsx } from "clsx";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { HiddenToggle } from "@/components/admin/HiddenToggle";
import { SortableList } from "@/components/admin/ui/interactive";
import { Btn, EmptyState, LinkBtn } from "@/components/admin/ui/primitives";
import { deleteLabAction, reorderLabsAction } from "./actions";
import type { Lab } from "@/types/content";

export function LabsListClient({ items: initial }: { items: Lab[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initial);
  const [toDelete, setToDelete] = useState<Lab | null>(null);
  const dirty = items.map((l) => l.id).join() !== initial.map((l) => l.id).join();

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteLabAction(toDelete.id);
      if (res.ok) {
        toast.success("נמחק — יוסר מהאתר תוך כדקה");
        setItems((all) => all.filter((l) => l.id !== toDelete.id));
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  const saveOrder = () =>
    startTransition(async () => {
      const res = await reorderLabsAction(items.map((l) => l.id));
      if (!res.ok) {
        toast.error(res.error ?? "השמירה נכשלה");
        return;
      }
      toast.success("הסדר נשמר — יתעדכן באתר תוך כדקה");
      router.refresh();
    });

  if (items.length === 0) {
    return (
      <EmptyState
        title="אין עדיין סרטוני מעבדה"
        action={
          <LinkBtn href="/admin/labs/new" variant="primary">
            + הוסף את הראשון
          </LinkBtn>
        }
      />
    );
  }

  return (
    <>
      <div
        className={clsx(
          "sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border p-2 text-xs transition-colors",
          dirty ? "border-primary-300 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10" : "border-border bg-surface",
        )}
      >
        <span className="flex-1 text-text-muted">
          {dirty ? "שינית את הסדר — שמור כדי לעדכן את האתר." : "גרור סרטון (או השתמש בחצים) כדי לשנות את הסדר בדף המעבדות. הראשון מוצג ראשון."}
        </span>
        {dirty && (
          <>
            <Btn size="sm" variant="ghost" onClick={() => setItems(initial)} disabled={pending}>
              <Undo2 className="h-3.5 w-3.5" />
              בטל
            </Btn>
            <Btn size="sm" variant="primary" onClick={saveOrder} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              שמור סדר
            </Btn>
          </>
        )}
      </div>

      <SortableList
        items={items}
        getKey={(l) => l.id}
        onReorder={setItems}
        disabled={pending}
        renderItem={(l) => (
          <div className={clsx("flex items-center gap-3", l.hidden && "opacity-55")}>
            <a href={`https://www.youtube.com/watch?v=${l.youtubeId}`} target="_blank" rel="noopener noreferrer" className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${l.youtubeId}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded-md object-cover" />
            </a>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text" title={l.title}>
                {l.title}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-text-subtle">{l.slug}</div>
            </div>
            <HiddenToggle kind="lab" id={l.id} hidden={!!l.hidden} compact />
            <Link
              href={`/admin/labs/${encodeURIComponent(l.id)}/edit`}
              prefetch={false}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
              aria-label="עריכה"
            >
              <Edit3 className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setToDelete(l)}
              disabled={pending}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              aria-label="מחק"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

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
