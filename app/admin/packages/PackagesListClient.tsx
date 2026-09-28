"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { Edit3, ExternalLink, Package, Trash2 } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { Badge, EmptyState, LinkBtn, PageHeader } from "@/components/admin/ui/primitives";
import { SortableList, Toggle } from "@/components/admin/ui/interactive";
import { deletePackageAction, reorderPackagesAction, setPackagePublishedAction } from "./actions";

interface PackageRow {
  id: string;
  slug: string;
  title: string;
  priceDisplay: string;
  displayOrder: number;
  published: boolean;
  createdAt: Date;
  videoCount: number;
}

export function PackagesListClient({ items: initial }: { items: PackageRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initial);
  const [toDelete, setToDelete] = useState<PackageRow | null>(null);

  const reorder = (next: PackageRow[]) => {
    const prev = items;
    setItems(next);
    startTransition(async () => {
      const res = await reorderPackagesAction(next.map((p) => p.id));
      if (!res.ok) {
        toast.error(res.error ?? "הסידור נכשל");
        setItems(prev);
        return;
      }
      router.refresh();
    });
  };

  const togglePublished = (p: PackageRow) => {
    const next = !p.published;
    setItems((all) => all.map((x) => (x.id === p.id ? { ...x, published: next } : x)));
    startTransition(async () => {
      const res = await setPackagePublishedAction(p.id, next);
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        setItems((all) => all.map((x) => (x.id === p.id ? { ...x, published: !next } : x)));
        return;
      }
      toast.success(next ? "הקורס מפורסם באתר" : "הקורס הועבר לטיוטה (לא מוצג באתר)");
      router.refresh();
    });
  };

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deletePackageAction(toDelete.id);
      if (res.ok) {
        toast.success("הקורס נמחק");
        setItems((all) => all.filter((x) => x.id !== toDelete.id));
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        icon={<Package className="h-5 w-5" />}
        title="קורסים"
        description={`${items.length} קורסים · גרור כדי לקבוע את הסדר באתר · מתג "מפורסם" מציג/מסתיר קורס מיד`}
        actions={
          <LinkBtn href="/admin/packages/new" variant="primary">
            + קורס חדש
          </LinkBtn>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="אין עדיין קורסים" />
      ) : (
        <SortableList
          items={items}
          getKey={(p) => p.id}
          onReorder={reorder}
          disabled={pending}
          renderItem={(p) => (
            <div className={clsx("flex flex-wrap items-center gap-3", !p.published && "opacity-70")}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-text">{p.title}</span>
                  {!p.published && <Badge>טיוטה</Badge>}
                  {p.published && p.videoCount === 0 && <Badge tone="warn">אין סרטונים</Badge>}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-text-subtle">
                  <span className="num">{p.videoCount} סרטונים</span>
                  <span className="num">{p.priceDisplay} ש״ח</span>
                  <span className="font-mono" dir="ltr">
                    /courses/{p.slug}
                  </span>
                </div>
              </div>
              <Toggle size="sm" checked={p.published} onChange={() => togglePublished(p)} label="מפורסם" disabled={pending} />
              <a
                href={`/courses/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                aria-label="צפה באתר"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href={`/admin/packages/${p.id}/edit`}
                prefetch={false}
                className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                aria-label="עריכה"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setToDelete(p)}
                disabled={pending}
                className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                aria-label="מחק"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      )}

      <DangerConfirm
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={doDelete}
        itemLabel={toDelete ? toDelete.title : ""}
        confirmText={toDelete?.slug ?? ""}
        title="מחיקת קורס"
        description="מחיקת הקורס תמחק גם את כל ההרשאות שתלמידים קיבלו אליו. אם רק רוצים להוריד אותו מהאתר — העבר לטיוטה במקום למחוק."
      />
    </div>
  );
}
