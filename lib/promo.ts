// The free promo of a course is its FIRST video — the one with the lowest
// package_videos.display_order (ties broken by video creation time). This is
// the same ordering the course page uses to render the list and build the
// "watch the promo" link, so the two can never disagree.

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";

// Sorting for a package's videos. Reuse everywhere a course's video list is read.
export const PACKAGE_VIDEO_ORDER = [asc(packageVideos.displayOrder), asc(videos.createdAt)] as const;

/**
 * Returns the published course for which `videoId` is the promo video, or
 * null if the video is not the first video of any published course.
 */
export async function findPromoCourse(
  videoId: string,
): Promise<{ id: string; slug: string; title: string } | null> {
  const courses = await db
    .select({
      id: contentPackages.id,
      slug: contentPackages.slug,
      title: contentPackages.title,
    })
    .from(packageVideos)
    .innerJoin(contentPackages, eq(packageVideos.packageId, contentPackages.id))
    .where(and(eq(packageVideos.videoId, videoId), eq(contentPackages.published, true)));

  for (const course of courses) {
    const [first] = await db
      .select({ videoId: packageVideos.videoId })
      .from(packageVideos)
      .innerJoin(videos, eq(packageVideos.videoId, videos.id))
      .where(eq(packageVideos.packageId, course.id))
      .orderBy(...PACKAGE_VIDEO_ORDER)
      .limit(1);
    if (first?.videoId === videoId) return course;
  }
  return null;
}
