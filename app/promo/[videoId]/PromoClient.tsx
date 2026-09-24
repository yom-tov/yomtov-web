"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";

interface PromoTokenData {
  playbackId: string;
  playbackToken: string;
  thumbnailToken: string;
}

export function PromoClient({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [tokens, setTokens] = useState<PromoTokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<HTMLElement | null>(null);
  const lastReported = useRef(0);

  const reportDuration = useCallback(
    (seconds: number) => {
      if (seconds <= 0 || seconds <= lastReported.current) return;
      lastReported.current = seconds;
      const data = JSON.stringify({
        videoId,
        durationSeconds: Math.floor(seconds),
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/video/promo-duration",
          new Blob([data], { type: "application/json" }),
        );
      } else {
        fetch("/api/video/promo-duration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    },
    [videoId],
  );

  useEffect(() => {
    const el = playerRef.current as unknown as HTMLMediaElement | null;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | null = null;

    const onPlay = () => {
      interval = setInterval(() => {
        if (el.currentTime && isFinite(el.currentTime)) {
          reportDuration(el.currentTime);
        }
      }, 15000);
    };
    const onPause = () => {
      if (interval) clearInterval(interval);
      if (el.currentTime && isFinite(el.currentTime)) {
        reportDuration(el.currentTime);
      }
    };
    const onEnded = () => {
      if (interval) clearInterval(interval);
      if (el.duration && isFinite(el.duration)) {
        reportDuration(el.duration);
      }
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      if (interval) clearInterval(interval);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      if (el.currentTime && isFinite(el.currentTime)) {
        reportDuration(el.currentTime);
      }
    };
  }, [reportDuration, tokens]);

  useEffect(() => {
    fetch("/api/video/promo-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to load promo");
        }
        return r.json() as Promise<PromoTokenData>;
      })
      .then((data) => {
        setTokens(data);
        fetch("/api/video/promo-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        }).catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, [videoId]);

  if (error) {
    return (
      <div className="aspect-video rounded-2xl bg-surface-2 flex items-center justify-center">
        <p className="text-sm text-rose-600">
          שגיאה בטעינת הפרומו: {error}
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
    <MuxPlayer
      ref={playerRef as React.RefObject<any>}
      playbackId={tokens.playbackId}
      tokens={{
        playback: tokens.playbackToken,
        thumbnail: tokens.thumbnailToken,
      }}
      metadata={{ video_title: title }}
      accentColor="#1E40AF"
      style={{
        aspectRatio: "16/9",
        width: "100%",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
      streamType="on-demand"
    />
  );
}
