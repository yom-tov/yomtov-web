"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Film, Loader2, UploadCloud, XCircle } from "lucide-react";

export interface MuxReady {
  assetId: string;
  playbackId: string;
  durationSeconds: number | null;
  fileName: string;
}

type Stage =
  | { kind: "idle" }
  | { kind: "uploading"; pct: number; fileName: string }
  | { kind: "processing"; fileName: string }
  | { kind: "ready"; fileName: string }
  | { kind: "error"; message: string };

const POLL_MS = 3000;

/**
 * Uploads a video file straight from the browser to Mux (a direct-upload URL
 * created by /api/admin/mux-upload), then polls until Mux has processed it.
 * The file never passes through our server, so size is not an issue.
 */
export function MuxUploader({ onReady }: { onReady: (r: MuxReady) => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      xhrRef.current?.abort();
      if (pollRef.current) clearTimeout(pollRef.current);
    },
    [],
  );

  const poll = (uploadId: string, fileName: string) => {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/mux-upload?id=${encodeURIComponent(uploadId)}`, { cache: "no-store" });
        const j = (await res.json()) as {
          stage?: string;
          assetId?: string;
          playbackId?: string | null;
          durationSeconds?: number | null;
          error?: string | null;
        };
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        if (j.stage === "ready" && j.assetId && j.playbackId) {
          setStage({ kind: "ready", fileName });
          onReady({ assetId: j.assetId, playbackId: j.playbackId, durationSeconds: j.durationSeconds ?? null, fileName });
          return;
        }
        if (j.stage === "errored" || j.stage === "cancelled" || j.stage === "timed_out") {
          setStage({ kind: "error", message: j.error || "Mux לא הצליח לעבד את הקובץ" });
          return;
        }
        poll(uploadId, fileName);
      } catch (e) {
        setStage({ kind: "error", message: (e as Error).message });
      }
    }, POLL_MS);
  };

  const start = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setStage({ kind: "error", message: "זה לא קובץ וידאו" });
      return;
    }
    setStage({ kind: "uploading", pct: 0, fileName: file.name });
    try {
      const res = await fetch("/api/admin/mux-upload", { method: "POST" });
      const j = (await res.json()) as { id?: string; url?: string; error?: string };
      if (!res.ok || !j.id || !j.url) throw new Error(j.error ?? "לא הצלחתי ליצור העלאה ב-Mux");
      const { id, url } = j;

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", url);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setStage({ kind: "uploading", pct: Math.round((ev.loaded / ev.total) * 100), fileName: file.name });
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStage({ kind: "processing", fileName: file.name });
          poll(id, file.name);
        } else {
          setStage({ kind: "error", message: `ההעלאה נכשלה (${xhr.status})` });
        }
      };
      xhr.onerror = () => setStage({ kind: "error", message: "ההעלאה נכשלה — בדוק את החיבור לאינטרנט" });
      xhr.send(file);
    } catch (e) {
      setStage({ kind: "error", message: (e as Error).message });
    }
  };

  const busy = stage.kind === "uploading" || stage.kind === "processing";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f && !busy) void start(f);
      }}
      className={clsx(
        "rounded-2xl border-2 border-dashed p-5 text-center transition-colors",
        drag ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-border-strong bg-surface",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void start(f);
          e.target.value = "";
        }}
      />

      {stage.kind === "idle" && (
        <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto flex flex-col items-center gap-2">
          <UploadCloud className="h-9 w-9 text-primary-500" />
          <span className="text-sm font-bold text-text">העלאת סרטון ל-Mux</span>
          <span className="text-xs text-text-muted">גרור קובץ וידאו לכאן או לחץ לבחירה. אחרי העיבוד הפרטים יתמלאו אוטומטית.</span>
        </button>
      )}

      {stage.kind === "uploading" && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-text">
            <Film className="h-4 w-4" />
            מעלה את {stage.fileName}… {stage.pct}%
          </div>
          <div className="mx-auto h-2 max-w-md overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${stage.pct}%` }} />
          </div>
          <div className="text-[11px] text-text-subtle">אל תסגור את הדף עד שההעלאה תסתיים.</div>
        </div>
      )}

      {stage.kind === "processing" && (
        <div className="flex flex-col items-center gap-1.5">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <div className="text-sm font-semibold text-text">Mux מעבד את הסרטון…</div>
          <div className="text-[11px] text-text-subtle">בדרך כלל לוקח דקה-שתיים לסרטון קצר, יותר לסרטון ארוך.</div>
        </div>
      )}

      {stage.kind === "ready" && (
        <div className="flex flex-col items-center gap-1.5">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <div className="text-sm font-semibold text-text">הסרטון מוכן — הפרטים מולאו למטה</div>
          <div className="text-[11px] text-text-subtle">{stage.fileName}</div>
        </div>
      )}

      {stage.kind === "error" && (
        <div className="flex flex-col items-center gap-2">
          <XCircle className="h-6 w-6 text-rose-500" />
          <div className="text-sm font-semibold text-rose-600">{stage.message}</div>
          <button
            type="button"
            onClick={() => setStage({ kind: "idle" })}
            className="text-xs font-semibold text-primary-700 hover:underline dark:text-primary-200"
          >
            נסה שוב
          </button>
        </div>
      )}
    </div>
  );
}
