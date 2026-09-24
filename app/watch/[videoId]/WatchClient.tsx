"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";
import { VideoWatermark } from "@/components/video/VideoWatermark";

interface WatermarkData {
  name: string;
  email: string;
  phone: string;
  uid: string;
}

interface TokenData {
  playbackId: string;
  playbackToken: string;
  thumbnailToken: string;
  storyboardToken: string;
  watermark: WatermarkData | null;
}

const TOKEN_REFRESH_MS = 8 * 60 * 1000;

export function WatchClient({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTokens = useCallback(async () => {
    const r = await fetch("/api/video/playback-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to load video");
    }
    return r.json() as Promise<TokenData>;
  }, [videoId]);

  useEffect(() => {
    Promise.all([
      fetchTokens(),
      fetch(`/api/video/progress?videoId=${videoId}`)
        .then((r) => r.json())
        .catch(() => ({ progress: null })),
    ])
      .then(([tokenData, progressData]) => {
        setTokens(tokenData);
        if (progressData.progress?.positionSeconds) {
          const pos = progressData.progress.positionSeconds;
          const dur = progressData.progress.durationSeconds;
          if (!dur || pos < dur - 5) {
            setStartTime(pos);
          }
        }
      })
      .catch((e) => setError(e.message));

    refreshTimer.current = setInterval(() => {
      fetchTokens()
        .then((t) => setTokens(t))
        .catch(() => {});
    }, TOKEN_REFRESH_MS);

    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [videoId, fetchTokens]);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-video-container]")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  useEffect(() => {
    let devtoolsOpen = false;
    const threshold = 160;
    const check = () => {
      const w = window.outerWidth - window.innerWidth > threshold;
      const h = window.outerHeight - window.innerHeight > threshold;
      if ((w || h) && !devtoolsOpen) {
        devtoolsOpen = true;
        const overlay = document.getElementById("devtools-warning");
        if (overlay) overlay.style.display = "flex";
      } else if (!w && !h && devtoolsOpen) {
        devtoolsOpen = false;
        const overlay = document.getElementById("devtools-warning");
        if (overlay) overlay.style.display = "none";
      }
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="aspect-video rounded-2xl bg-surface-2 flex items-center justify-center">
        <p className="text-sm text-rose-600">
          שגיאה בטעינת הסרטון: {error}
        </p>
      </div>
    );
  }

  if (!tokens) {
    return (
      <div className="aspect-video rounded-2xl bg-surface-2 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div data-video-container className="relative">
      <MuxVideoPlayer
        playbackId={tokens.playbackId}
        playbackToken={tokens.playbackToken}
        thumbnailToken={tokens.thumbnailToken}
        storyboardToken={tokens.storyboardToken}
        title={title}
        videoId={videoId}
        startTime={startTime}
      />
      {tokens.watermark && <VideoWatermark data={tokens.watermark} />}
      <div
        id="devtools-warning"
        style={{
          display: "none",
          position: "absolute",
          inset: 0,
          zIndex: 30,
          background: "rgba(0,0,0,0.92)",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-lg)",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <p style={{ color: "#f87171", fontWeight: 700, fontSize: "16px" }}>
          כלי הפיתוח פתוחים
        </p>
        <p style={{ color: "#fbbf24", fontSize: "13px" }}>
          סגור את כלי הפיתוח כדי להמשיך לצפות
        </p>
      </div>
    </div>
  );
}
