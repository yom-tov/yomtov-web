import { db } from "@/lib/db";
import { videos, packageVideos } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { VideosListClient } from "./VideosListClient";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const allVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      muxAssetId: videos.muxAssetId,
      muxPlaybackId: videos.muxPlaybackId,
      durationSeconds: videos.durationSeconds,
      displayOrder: videos.displayOrder,
      createdAt: videos.createdAt,
      packageCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${packageVideos}
        WHERE ${packageVideos.videoId} = ${videos.id}
      )`,
    })
    .from(videos)
    .orderBy(videos.displayOrder);

  return <VideosListClient items={allVideos} />;
}
