"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { deletePackageAction } from "./actions";

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

export function PackagesListClient({ items }: { items: PackageRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<PackageRow | null>(null);

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deletePackageAction(toDelete.id);
      if (res.ok) {
        toast.success("החבילה נמחקה");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "מחיקה נכשלה");
      }
    });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">חבילות תוכן</h1>
          <p className="text-sm text-text-muted num">{items.length} חבילות</p>
        </div>
        <Link
          href="/admin/packages/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          חבילה חדשה
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>כותרת</Th>
              <Th>מחיר</Th>
              <Th>סרטונים</Th>
              <Th>סדר</Th>
              <Th>סטטוס</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((pkg) => (
              <tr
                key={pkg.id}
                className="border-t border-border hover:bg-surface-2/40"
              >
                <Td>
                  <div className="font-semibold text-text">{pkg.title}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-subtle">
                    {pkg.slug}
                  </div>
                </Td>
                <Td className="num">{pkg.priceDisplay}</Td>
                <Td className="num">{pkg.videoCount}</Td>
                <Td className="num">{pkg.displayOrder}</Td>
                <Td>
                  {pkg.published ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Eye className="h-3.5 w-3.5" /> מפורסם
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-subtle">
                      <EyeOff className="h-3.5 w-3.5" /> טיוטה
                    </span>
                  )}
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/packages/${pkg.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> ערוך
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(pkg)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-rose-300 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> מחק
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-text-subtle"
                >
                  אין חבילות עדיין
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
        title="מחיקת חבילה"
        description="מחיקת החבילה תמחק גם את כל שיוכי הסרטונים אליה. רכישות קיימות של משתמשים יתבטלו."
      />
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 text-xs font-bold text-text-muted ${className}`}>
      {children}
    </th>
  );
}
function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>
  );
}
