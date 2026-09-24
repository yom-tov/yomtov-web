import { NextResponse } from "next/server";
import { requireUserSession } from "@/lib/user-auth";
import { canWatchVideo } from "@/lib/admin/purchase-helpers";
import { signPlaybackToken, signThumbnailToken, signStoryboardToken } from "@/lib/mux/playback";
import { db } from "@/lib/db";
import { videos, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireUserSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

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

  const allowed = await canWatchVideo(session.sub, videoId);
  if (!allowed) {
    return NextResponse.json({ error: "ACCESS_DENIED" }, { status: 403 });
  }

  const [user] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const viewerId = session.sub.slice(0, 8);

  const [playbackToken, thumbnailToken, storyboardToken] = await Promise.all([
    signPlaybackToken(video.muxPlaybackId, { viewerId }),
    signThumbnailToken(video.muxPlaybackId),
    signStoryboardToken(video.muxPlaybackId),
  ]);

  return NextResponse.json({
    playbackId: video.muxPlaybackId,
    playbackToken,
    thumbnailToken,
    storyboardToken,
    watermark: user
      ? {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone ?? "",
          uid: viewerId,
        }
      : null,
  });
}
