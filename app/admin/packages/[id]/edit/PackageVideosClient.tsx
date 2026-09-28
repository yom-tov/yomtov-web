"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clsx } from "clsx";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge, Btn, EmptyState, Select } from "@/components/admin/ui/primitives";
import { SortableList } from "@/components/admin/ui/interactive";
import {
  assignVideoToPackageAction,
  removeVideoFromPackageAction,
  reorderPackageVideosAction,
} from "../../actions";

interface AssignedVideo {
  videoId: string;
  videoTitle: string;
  muxPlaybackId: string;
  durationSeconds: number | null;
  displayOrder: number;
  hidden: boolean;
}

interface AvailableVideo {
  id: string;
  title: string;
  durationSeconds: number | null;
}

function formatDuration(sec: number | null) {
  if (!sec) return "-";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PackageVideosClient({
  packageId,
  assignedVideos,
  availableVideos,
  promoMinutes,
}: {
  packageId: string;
  assignedVideos: AssignedVideo[];
  availableVideos: AvailableVideo[];
  promoMinutes: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(assignedVideos);
  const [selectedVideo, setSelectedVideo] = useState("");

  const promoId = items.find((v) => !v.hidden)?.videoId;

  const reorder = (next: AssignedVideo[]) => {
    const prev = items;
    setItems(next);
    startTransition(async () => {
      const res = await reorderPackageVideosAction(packageId, next.map((v) => v.videoId));
      if (!res.ok) {
        toast.error(res.error ?? "הסידור נכשל");
        setItems(prev);
        return;
      }
      router.refresh();
    });
  };

  const handleAssign = () => {
    if (!selectedVideo) return;
    const nextOrder = items.reduce((m, v) => Math.max(m, v.displayOrder), 0) + 1;
    startTransition(async () => {
      const res = await assignVideoToPackageAction({ packageId, videoId: selectedVideo, displayOrder: nextOrder });
      if (res.ok) {
        toast.success("הסרטון נוסף לסוף הקורס");
        setSelectedVideo("");
        router.refresh();
      } else toast.error(res.error ?? "שגיאה");
    });
  };

  const handleRemove = (v: AssignedVideo) => {
    if (!confirm(`להסיר את "${v.videoTitle}" מהקורס? (הסרטון עצמו לא נמחק)`)) return;
    startTransition(async () => {
      const res = await removeVideoFromPackageAction(packageId, v.videoId);
      if (res.ok) {
        setItems((all) => all.filter((x) => x.videoId !== v.videoId));
        toast.success("הסרטון הוסר מהקורס");
        router.refresh();
      } else toast.error(res.error ?? "שגיאה");
    });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState title="אין עדיין סרטונים בקורס" description="בחר סרטון מהרשימה למטה כדי להוסיף." />
      ) : (
        <>
          <p className="text-xs text-text-muted">
            גרור כדי לסדר. <b>הסרטון הראשון</b> הוא הפרומו — {promoMinutes} הדקות הראשונות שלו פתוחות לכולם בחינם.
          </p>
          <SortableList
            items={items}
            getKey={(v) => v.videoId}
            onReorder={reorder}
            disabled={pending}
            renderItem={(v, i) => (
              <div className={clsx("flex items-center gap-3", v.hidden && "opacity-55")}>
                <span className="num w-6 shrink-0 text-center text-xs font-bold text-text-subtle">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text">{v.videoTitle}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="num text-[11px] text-text-subtle">{formatDuration(v.durationSeconds)}</span>
                    {v.videoId === promoId && (
                      <Badge tone="warn">
                        <Sparkles className="h-3 w-3" />
                        פרומו חינם
                      </Badge>
                    )}
                    {v.hidden && <Badge>מוסתר</Badge>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(v)}
                  disabled={pending}
                  className="rounded-lg p-1.5 text-text-subtle hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label="הסר מהקורס"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        </>
      )}

      {availableVideos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border-strong p-3">
          <Select value={selectedVideo} onChange={(e) => setSelectedVideo(e.target.value)} className="min-w-0 flex-1">
            <option value="">הוספת סרטון קיים לקורס…</option>
            {availableVideos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} ({formatDuration(v.durationSeconds)})
              </option>
            ))}
          </Select>
          <Btn variant="primary" onClick={handleAssign} disabled={!selectedVideo || pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            הוסף
          </Btn>
        </div>
      )}
    </div>
  );
}
