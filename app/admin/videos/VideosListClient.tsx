"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit3, RefreshCw, Search, Trash2, Video } from "lucide-react";
import { DangerConfirm } from "@/components/admin/DangerConfirm";
import { Badge, DataTable, EmptyState, Input, LinkBtn, PageHeader, THead, Td, Th, Tr } from "@/components/admin/ui/primitives";
import { VisibilityToggle } from "@/components/admin/ui/interactive";
import { deleteVideoAction, setVideoHiddenAction, syncVideoFromMuxAction } from "./actions";

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  muxAssetId: string;
  muxPlaybackId: string;
  durationSeconds: number | null;
  displayOrder: number;
  hidden: boolean;
  createdAt: Date;
  courses: string[];
}

function formatDuration(sec: number | null) {
  if (!sec) return "-";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideosListClient({ items }: { items: VideoRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [toDelete, setToDelete] = useState<VideoRow | null>(null);
  const [deleteFromMux, setDeleteFromMux] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((v) => `${v.title} ${v.courses.join(" ")}`.toLowerCase().includes(needle));
  }, [items, q]);

  const doSync = (videoId: string) => {
    setBusy(videoId);
    startTransition(async () => {
      const res = await syncVideoFromMuxAction(videoId);
      setBusy(null);
      if (res.ok) {
        toast.success("המשך עודכן מ-Mux");
        router.refresh();
      } else toast.error(res.error ?? "סנכרון נכשל");
    });
  };

  const toggleHidden = (v: VideoRow) => {
    setBusy(v.id);
    startTransition(async () => {
      const res = await setVideoHiddenAction(v.id, !v.hidden);
      setBusy(null);
      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(v.hidden ? "הסרטון מוצג שוב בקורסים" : "הסרטון הוסתר מכל הקורסים");
      router.refresh();
    });
  };

  const doDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteVideoAction(toDelete.id, deleteFromMux);
      if (res.ok) {
        if (res.error) toast.warning(res.error);
        else toast.success(deleteFromMux ? "הסרטון נמחק מהאתר ומ-Mux" : "הסרטון נמחק מהאתר");
        setToDelete(null);
        router.refresh();
      } else toast.error(res.error ?? "מחיקה נכשלה");
    });
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        icon={<Video className="h-5 w-5" />}
        title="סרטוני קורס (Mux)"
        description={`${items.length} סרטונים · סרטון מוסתר לא מופיע באף קורס ולא ניתן לצפייה`}
        actions={
          <LinkBtn href="/admin/videos/new" variant="primary">
            + העלאת סרטון
          </LinkBtn>
        }
      />

      <label className="relative mb-4 block max-w-md">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם סרטון או קורס…" className="pr-9" />
      </label>

      {filtered.length === 0 ? (
        <EmptyState title={items.length ? "אין תוצאות" : "אין סרטונים עדיין"} />
      ) : (
        <DataTable>
          <THead>
            <Th>כותרת</Th>
            <Th>משך</Th>
            <Th>בקורסים</Th>
            <Th className="w-0">פעולות</Th>
          </THead>
          <tbody>
            {filtered.map((v) => (
              <Tr key={v.id} muted={v.hidden}>
                <Td>
                  <div className="font-semibold text-text">{v.title}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-text-subtle" dir="ltr">
                    {v.muxPlaybackId.slice(0, 18)}…
                  </div>
                </Td>
                <Td className="num whitespace-nowrap">{formatDuration(v.durationSeconds)}</Td>
                <Td>
                  {v.courses.length ? (
                    <div className="flex flex-wrap gap-1">
                      {v.courses.map((c, i) => (
                        <Badge key={i} tone="primary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-text-subtle">לא משויך לקורס</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <VisibilityToggle compact hidden={v.hidden} pending={busy === v.id} onToggle={() => toggleHidden(v)} />
                    <button
                      type="button"
                      onClick={() => doSync(v.id)}
                      disabled={pending}
                      title="עדכון המשך מ-Mux"
                      className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/admin/videos/${v.id}/edit`}
                      prefetch={false}
                      className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text"
                      aria-label="עריכה"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteFromMux(false);
                        setToDelete(v);
                      }}
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
        itemLabel={toDelete ? toDelete.title : ""}
        confirmText={toDelete?.title ?? ""}
        title="מחיקת סרטון"
        description="הסרטון יוסר מכל הקורסים שהוא משויך אליהם, וההתקדמות של התלמידים בו תימחק. אם רק רוצים להוריד אותו זמנית — עדיף להסתיר (העין)."
      >
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={deleteFromMux}
            onChange={(e) => setDeleteFromMux(e.target.checked)}
            className="h-4 w-4 accent-rose-600"
          />
          למחוק את הקובץ גם מ-Mux (חוסך בעלויות אחסון, אי אפשר לשחזר)
        </label>
      </DangerConfirm>
    </div>
  );
}
