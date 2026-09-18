"use client";

import MuxPlayer from "@mux/mux-player-react";

interface MuxVideoPlayerProps {
  playbackId: string;
  playbackToken: string;
  thumbnailToken?: string;
  storyboardToken?: string;
  title?: string;
}

export function MuxVideoPlayer({
  playbackId,
  playbackToken,
  thumbnailToken,
  storyboardToken,
  title,
}: MuxVideoPlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={{
        playback: playbackToken,
        thumbnail: thumbnailToken,
        storyboard: storyboardToken,
      }}
      metadata={{
        video_title: title,
      }}
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
