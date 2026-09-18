import { db } from "@/lib/db";
import {
  userPurchases,
  contentPackages,
  packageVideos,
  videos,
} from "@/lib/db/schema";
import { eq, and, or, isNull, gt } from "drizzle-orm";

export async function hasActiveAccess(
  userId: string,
  packageId: string,
): Promise<boolean> {
  const now = new Date();
  const [purchase] = await db
    .select({ id: userPurchases.id })
    .from(userPurchases)
    .where(
      and(
        eq(userPurchases.userId, userId),
        eq(userPurchases.packageId, packageId),
        eq(userPurchases.status, "active"),
        or(isNull(userPurchases.expiresAt), gt(userPurchases.expiresAt, now)),
      ),
    )
    .limit(1);
  return !!purchase;
}

export async function canWatchVideo(
  userId: string,
  videoId: string,
): Promise<boolean> {
  const now = new Date();
  const results = await db
    .select({ purchaseId: userPurchases.id })
    .from(userPurchases)
    .innerJoin(
      packageVideos,
      eq(userPurchases.packageId, packageVideos.packageId),
    )
    .where(
      and(
        eq(userPurchases.userId, userId),
        eq(packageVideos.videoId, videoId),
        eq(userPurchases.status, "active"),
        or(isNull(userPurchases.expiresAt), gt(userPurchases.expiresAt, now)),
      ),
    )
    .limit(1);
  return results.length > 0;
}

export async function getUserPackages(userId: string) {
  const now = new Date();
  return db
    .select({
      purchaseId: userPurchases.id,
      grantedAt: userPurchases.grantedAt,
      expiresAt: userPurchases.expiresAt,
      status: userPurchases.status,
      packageId: contentPackages.id,
      packageSlug: contentPackages.slug,
      packageTitle: contentPackages.title,
      packageDescription: contentPackages.description,
      packageThumbnailUrl: contentPackages.thumbnailUrl,
    })
    .from(userPurchases)
    .innerJoin(
      contentPackages,
      eq(userPurchases.packageId, contentPackages.id),
    )
    .where(
      and(
        eq(userPurchases.userId, userId),
        eq(userPurchases.status, "active"),
        or(isNull(userPurchases.expiresAt), gt(userPurchases.expiresAt, now)),
      ),
    );
}

export async function getPackageVideos(packageId: string) {
  return db
    .select({
      videoId: videos.id,
      videoTitle: videos.title,
      videoDescription: videos.description,
      muxPlaybackId: videos.muxPlaybackId,
      durationSeconds: videos.durationSeconds,
      thumbnailTime: videos.thumbnailTime,
      displayOrder: packageVideos.displayOrder,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .where(eq(packageVideos.packageId, packageId))
    .orderBy(packageVideos.displayOrder);
}
