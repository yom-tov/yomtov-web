import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  users,
  userPurchases,
  contentPackages,
  packageVideos,
  videos,
  videoProgress,
  userActivity,
} from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { UserDetailClient } from "./UserDetailClient";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) notFound();

  const purchases = await db
    .select({
      purchaseId: userPurchases.id,
      packageId: contentPackages.id,
      packageTitle: contentPackages.title,
      packageSlug: contentPackages.slug,
      grantedAt: userPurchases.grantedAt,
      expiresAt: userPurchases.expiresAt,
      revokedAt: userPurchases.revokedAt,
      status: userPurchases.status,
      paymentMethod: userPurchases.paymentMethod,
      paymentNote: userPurchases.paymentNote,
      adminNotes: userPurchases.adminNotes,
    })
    .from(userPurchases)
    .innerJoin(
      contentPackages,
      eq(userPurchases.packageId, contentPackages.id),
    )
    .where(eq(userPurchases.userId, id))
    .orderBy(sql`${userPurchases.grantedAt} DESC`);

  const allPackages = await db
    .select({
      id: contentPackages.id,
      title: contentPackages.title,
    })
    .from(contentPackages)
    .orderBy(contentPackages.displayOrder);

  const progressRows = await db
    .select({
      videoId: videoProgress.videoId,
      positionSeconds: videoProgress.positionSeconds,
      durationSeconds: videoProgress.durationSeconds,
      updatedAt: videoProgress.updatedAt,
    })
    .from(videoProgress)
    .where(eq(videoProgress.userId, id));

  const allVideos = await db
    .select({
      videoId: videos.id,
      videoTitle: videos.title,
      videoDuration: videos.durationSeconds,
      packageId: packageVideos.packageId,
      displayOrder: packageVideos.displayOrder,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .orderBy(packageVideos.displayOrder);

  const packagesInfo = await db
    .select({
      id: contentPackages.id,
      title: contentPackages.title,
      slug: contentPackages.slug,
    })
    .from(contentPackages)
    .orderBy(contentPackages.displayOrder);

  const promoViews = await db
    .select({
      id: userActivity.id,
      videoId: userActivity.videoId,
      createdAt: userActivity.createdAt,
    })
    .from(userActivity)
    .where(
      and(
        eq(userActivity.userId, id),
        eq(userActivity.eventType, "promo_view"),
      ),
    )
    .orderBy(desc(userActivity.createdAt))
    .limit(50);

  const recentActivity = await db
    .select({
      id: userActivity.id,
      eventType: userActivity.eventType,
      videoId: userActivity.videoId,
      metadata: userActivity.metadata,
      createdAt: userActivity.createdAt,
    })
    .from(userActivity)
    .where(eq(userActivity.userId, id))
    .orderBy(desc(userActivity.createdAt))
    .limit(30);

  return (
    <UserDetailClient
      user={{
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        institution: user.institution,
        emailVerified: user.emailVerified,
        active: user.active,
        createdAt: user.createdAt,
      }}
      purchases={purchases}
      allPackages={allPackages}
      videoProgress={progressRows}
      allVideos={allVideos}
      packagesInfo={packagesInfo}
      promoViews={promoViews}
      recentActivity={recentActivity}
    />
  );
}
