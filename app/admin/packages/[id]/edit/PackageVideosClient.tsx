"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  assignVideoToPackageAction,
  removeVideoFromPackageAction,
} from "../../actions";

interface AssignedVideo {
  videoId: string;
  videoTitle: string;
  muxPlaybackId: string;
  durationSeconds: number | null;
  displayOrder: number;
}

interface AvailableVideo {
  id: string;
  title: string;
  durationSeconds: number | null;
}

export function PackageVideosClient({
  packageId,
  assignedVideos,
  availableVideos,
}: {
  packageId: string;
  assignedVideos: AssignedVideo[];
  availableVideos: AvailableVideo[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedVideo, setSelectedVideo] = useState("");
  const [order, setOrder] = useState(0);

  const handleAssign = () => {
    if (!selectedVideo) return;
    startTransition(async () => {
      const res = await assignVideoToPackageAction({
        packageId,
        videoId: selectedVideo,
        displayOrder: order,
      });
      if (res.ok) {
        toast.success("הסרטון שויך לחבילה");
        setSelectedVideo("");
        setOrder(0);
        router.refresh();
      } else {
        toast.error(res.error ?? "שגיאה");
      }
    });
  };

  const handleRemove = (videoId: string) => {
    startTransition(async () => {
      const res = await removeVideoFromPackageAction(packageId, videoId);
      if (res.ok) {
        toast.success("הסרטון הוסר מהחבילה");
        router.refresh();
      } else {
        toast.error(res.error ?? "שגיאה");
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
    <div className="space-y-4">
      {assignedVideos.length > 0 ? (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-right">
              <tr>
                <th className="px-3 py-2 text-xs font-bold text-text-muted">
                  סרטון
                </th>
                <th className="px-3 py-2 text-xs font-bold text-text-muted">
                  משך
                </th>
                <th className="px-3 py-2 text-xs font-bold text-text-muted">
                  סדר
                </th>
                <th className="px-3 py-2 text-xs font-bold text-text-muted w-0">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {assignedVideos.map((v) => (
                <tr
                  key={v.videoId}
                  className="border-t border-border hover:bg-surface-2/40"
                >
                  <td className="px-3 py-2">
                    <div className="font-semibold text-text">
                      {v.videoTitle}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-text-subtle">
                      {v.muxPlaybackId}
                    </div>
                  </td>
                  <td className="px-3 py-2 num">
                    {formatDuration(v.durationSeconds)}
                  </td>
                  <td className="px-3 py-2 num">{v.displayOrder}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(v.videoId)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs text-text-muted hover:border-rose-300 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> הסר
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface-2/30 px-4 py-8 text-center text-sm text-text-subtle">
          אין סרטונים משויכים לחבילה זו עדיין
        </div>
      )}

      {availableVideos.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-3">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1">
            <span className="text-[10px] font-semibold text-text-subtle">
              הוסף סרטון
            </span>
            <select
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
            >
              <option value="">בחר סרטון...</option>
              {availableVideos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}{" "}
                  {v.durationSeconds
                    ? `(${formatDuration(v.durationSeconds)})`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-text-subtle">
              סדר
            </span>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              min={0}
              max={999}
              className="h-9 w-20 rounded-lg border border-border bg-white px-3 text-sm text-text focus:border-primary-500 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedVideo || pending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            שייך
          </button>
        </div>
      )}
    </div>
  );
}
