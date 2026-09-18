"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  createVideoAction,
  updateVideoAction,
} from "@/app/admin/videos/actions";

type Mode = "create" | "edit";

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  muxAssetId: string;
  muxPlaybackId: string;
  durationSeconds: number | null;
  thumbnailTime: number | null;
  displayOrder: number;
}

export function VideoForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: VideoData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [muxAssetId, setMuxAssetId] = useState(initial?.muxAssetId ?? "");
  const [muxPlaybackId, setMuxPlaybackId] = useState(
    initial?.muxPlaybackId ?? "",
  );
  const [durationSeconds, setDurationSeconds] = useState<string>(
    initial?.durationSeconds != null ? String(initial.durationSeconds) : "",
  );
  const [thumbnailTime, setThumbnailTime] = useState<string>(
    initial?.thumbnailTime != null ? String(initial.thumbnailTime) : "0",
  );
  const [displayOrder, setDisplayOrder] = useState(
    initial?.displayOrder ?? 0,
  );

  const canSubmit =
    !pending &&
    title.trim().length > 0 &&
    muxAssetId.trim().length > 0 &&
    muxPlaybackId.trim().length > 0;

  const submit = () => {
    startTransition(async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        muxAssetId: muxAssetId.trim(),
        muxPlaybackId: muxPlaybackId.trim(),
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
        thumbnailTime: thumbnailTime ? Number(thumbnailTime) : 0,
        displayOrder,
      };

      const res =
        mode === "create"
          ? await createVideoAction(body)
          : await updateVideoAction(initial!.id, body);

      if (!res.ok) {
        toast.error(res.error ?? "שגיאה");
        return;
      }
      toast.success(
        mode === "create" ? "הסרטון נוצר בהצלחה" : "הסרטון עודכן בהצלחה",
      );
      router.push("/admin/videos");
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit();
      }}
      className="max-w-3xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <Link
          href="/admin/videos"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לרשימת הסרטונים
        </Link>
      </div>

      <Field label="כותרת">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="למשל: שיעור 1 - מבוא לחוק אוהם"
        />
      </Field>

      <Field label="תיאור (אופציונלי)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input !h-24 !py-2"
          placeholder="תיאור קצר של הסרטון"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mux Asset ID">
          <input
            value={muxAssetId}
            onChange={(e) => setMuxAssetId(e.target.value)}
            className="input font-mono text-xs"
            placeholder="מה-dashboard של Mux"
          />
        </Field>
        <Field label="Mux Playback ID">
          <input
            value={muxPlaybackId}
            onChange={(e) => setMuxPlaybackId(e.target.value)}
            className="input font-mono text-xs"
            placeholder="מה-dashboard של Mux"
          />
        </Field>
        <Field label="משך (שניות)">
          <input
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            min={0}
            className="input"
            placeholder="120"
          />
        </Field>
        <Field label="זמן תמונה ממוזערת (שניות)">
          <input
            type="number"
            value={thumbnailTime}
            onChange={(e) => setThumbnailTime(e.target.value)}
            min={0}
            step={0.1}
            className="input"
            placeholder="0"
          />
        </Field>
        <Field label="סדר תצוגה">
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
            min={0}
            max={999}
            className="input"
          />
        </Field>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="text-xs text-text-subtle">
          {mode === "create"
            ? "הסרטון יישמר במסד הנתונים. ודא שה-Asset ID וה-Playback ID נכונים."
            : "שינויים ייכנסו לתוקף מיידית."}
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending
            ? "שומר…"
            : mode === "create"
              ? "צור סרטון"
              : "עדכן"}
        </button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: white;
          color: var(--text);
          font-size: 14px;
        }
        .input:focus {
          outline: none;
          border-color: var(--primary-500);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-text-subtle">{label}</span>
      {children}
    </label>
  );
}
