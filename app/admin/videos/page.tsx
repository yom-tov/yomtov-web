import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
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
      hidden: videos.hidden,
      createdAt: videos.createdAt,
      // Titles of the courses this video belongs to.
      courses: sql<string[]>`COALESCE((
        SELECT array_agg("content_packages"."title" ORDER BY "content_packages"."display_order")
        FROM "package_videos"
        INNER JOIN "content_packages" ON "content_packages"."id" = "package_videos"."package_id"
        WHERE "package_videos"."video_id" = "videos"."id"
      ), ARRAY[]::varchar[])`,
    })
    .from(videos)
    .orderBy(videos.displayOrder, videos.createdAt);

  return <VideosListClient items={allVideos} />;
}
