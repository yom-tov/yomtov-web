"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, Trash2, Plus, RefreshCw } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { deleteVideoAction, syncVideoFromMuxAction } from "./actions";

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  muxAssetId: string;
  muxPlaybackId: string;
  durationSeconds: number | null;
  displayOrder: number;
  createdAt: Date;
  packageCount: number;
}

export function VideosListClient({ items }: { items: VideoRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<VideoRow | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const doSync = (videoId: string) => {
    setSyncing(videoId);
    startTransition(async () => {
      const res = await syncVideoFromMuxAction(videoId);
      if (res.ok) {
        toast.success("נתוני הסרטון עודכנו מ-Mux");
        router.refresh();
      } else {
        toast.error(res.error ?? "סנכרון נכשל");
      }
      setSyncing(null);
    });
  };

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteVideoAction(toDelete.id);
      if (res.ok) {
        toast.success("הסרטון נמחק");
        setToDelete(null);
        router.refresh();
      } else {
        toast.error(res.error ?? "מחיקה נכשלה");
      }
    });
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return "-";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">סרטונים</h1>
          <p className="text-sm text-text-muted num">{items.length} סרטונים</p>
        </div>
        <Link
          href="/admin/videos/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          סרטון חדש
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2/60 text-right">
            <tr>
              <Th>כותרת</Th>
              <Th>Playback ID</Th>
              <Th>משך</Th>
              <Th>חבילות</Th>
              <Th>סדר</Th>
              <Th className="w-0">פעולות</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr
                key={v.id}
                className="border-t border-border hover:bg-surface-2/40"
              >
                <Td>
                  <div className="font-semibold text-text">{v.title}</div>
                </Td>
                <Td>
                  <span className="font-mono text-[11px] text-text-subtle">
                    {v.muxPlaybackId.slice(0, 16)}...
                  </span>
                </Td>
                <Td className="num">{formatDuration(v.durationSeconds)}</Td>
                <Td className="num">{v.packageCount}</Td>
                <Td className="num">{v.displayOrder}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => doSync(v.id)}
                      disabled={pending || syncing === v.id}
                      title="סנכרון משך מ-Mux"
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-accent-300 hover:text-accent-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncing === v.id ? "animate-spin" : ""}`} /> סנכרון
                    </button>
                    <Link
                      href={`/admin/videos/${v.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> ערוך
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(v)}
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
                  אין סרטונים עדיין
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
        itemLabel={toDelete ? toDelete.title : ""}
        confirmText={toDelete?.title ?? ""}
        title="מחיקת סרטון"
        description="מחיקת הסרטון תסיר אותו מכל החבילות שהוא משויך אליהן. הסרטון ב-Mux לא יימחק."
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
