import { NextResponse } from "next/server";
import { signPlaybackToken, signThumbnailToken } from "@/lib/mux/playback";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { findPromoCourse } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROMO_DURATION_SECONDS = 1800; // 30 minutes

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const videoId = body?.videoId;
  if (!videoId || typeof videoId !== "string") {
    return NextResponse.json({ error: "videoId required" }, { status: 400 });
  }

  const [video] = await db
    .select({ muxPlaybackId: videos.muxPlaybackId })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const course = await findPromoCourse(videoId);
  if (!course) {
    return NextResponse.json(
      { error: "Promo is only available for the first video of a course" },
      { status: 403 },
    );
  }

  const [playbackToken, thumbnailToken] = await Promise.all([
    signPlaybackToken(video.muxPlaybackId, {
      assetEndTime: PROMO_DURATION_SECONDS,
    }),
    signThumbnailToken(video.muxPlaybackId),
  ]);

  return NextResponse.json({
    playbackId: video.muxPlaybackId,
    playbackToken,
    thumbnailToken,
  });
}
