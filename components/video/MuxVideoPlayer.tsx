"use client";

import { useRef, useCallback, useEffect } from "react";
import MuxPlayer from "@mux/mux-player-react";

interface MuxVideoPlayerProps {
  playbackId: string;
  playbackToken: string;
  thumbnailToken?: string;
  storyboardToken?: string;
  title?: string;
  videoId?: string;
  startTime?: number;
}

export function MuxVideoPlayer({
  playbackId,
  playbackToken,
  thumbnailToken,
  storyboardToken,
  title,
  videoId,
  startTime,
}: MuxVideoPlayerProps) {
  const lastSaved = useRef(0);
  const playerRef = useRef<HTMLElement | null>(null);

  const saveProgress = useCallback(
    (position: number, duration: number) => {
      if (!videoId) return;
      if (Math.abs(position - lastSaved.current) < 10) return;
      lastSaved.current = position;
      fetch("/api/video/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          positionSeconds: Math.floor(position),
          durationSeconds: Math.floor(duration),
        }),
      }).catch(() => {});
    },
    [videoId],
  );

  useEffect(() => {
    const el = playerRef.current as unknown as HTMLMediaElement | null;
    if (!el) return;
    const handler = () => {
      const pos = el.currentTime;
      const dur = el.duration;
      if (pos && dur && isFinite(dur)) {
        saveProgress(pos, dur);
      }
    };
    el.addEventListener("timeupdate", handler);
    el.addEventListener("pause", handler);
    return () => {
      el.removeEventListener("timeupdate", handler);
      el.removeEventListener("pause", handler);
    };
  }, [saveProgress]);

  return (
    <MuxPlayer
      ref={playerRef as React.RefObject<any>}
      playbackId={playbackId}
      tokens={{
        playback: playbackToken,
        thumbnail: thumbnailToken,
        storyboard: storyboardToken,
      }}
      metadata={{
        video_title: title,
      }}
      startTime={startTime}
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
