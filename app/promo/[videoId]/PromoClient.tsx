"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MuxVideoPlayer } from "@/components/video/MuxVideoPlayer";

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
    <MuxVideoPlayer
      playbackId={tokens.playbackId}
      playbackToken={tokens.playbackToken}
      thumbnailToken={tokens.thumbnailToken}
      title={title}
    />
  );
}
