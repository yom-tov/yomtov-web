"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";

interface TokenData {
  playbackId: string;
  playbackToken: string;
  thumbnailToken: string;
  storyboardToken: string;
}

export function WatchClient({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/video/playback-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to load video");
        }
        return r.json();
      })
      .then((data: TokenData) => setTokens(data))
      .catch((e) => setError(e.message));
  }, [videoId]);

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
    <MuxVideoPlayer
      playbackId={tokens.playbackId}
      playbackToken={tokens.playbackToken}
      thumbnailToken={tokens.thumbnailToken}
      storyboardToken={tokens.storyboardToken}
      title={title}
    />
  );
}
