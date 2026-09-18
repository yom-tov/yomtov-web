import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUserSession } from "@/lib/user-auth";
import { canWatchVideo } from "@/lib/admin/purchase-helpers";
import { db } from "@/lib/db";
import { videos, packageVideos, contentPackages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Lock } from "lucide-react";
import { WatchClient } from "./WatchClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const [video] = await db
    .select({ title: videos.title })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);
  return {
    title: video?.title ?? "צפייה בסרטון",
    robots: { index: false, follow: false },
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;
  const session = await requireUserSession();

  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video) notFound();

  const allowed = await canWatchVideo(session.sub, videoId);

  if (!allowed) {
    return (
      <div className="container-page py-10 max-w-2xl text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-10">
          <Lock className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-xl font-bold text-text">
            אין גישה לסרטון זה
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            כדי לצפות בסרטון זה, יש לרכוש גישה לחבילה שכוללת אותו.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105"
          >
            לקטלוג הקורסים
          </Link>
        </div>
      </div>
    );
  }

  // Find the package this video belongs to (first match) for back navigation
  const [pkgLink] = await db
    .select({
      packageId: packageVideos.packageId,
      packageTitle: contentPackages.title,
    })
    .from(packageVideos)
    .innerJoin(contentPackages, eq(packageVideos.packageId, contentPackages.id))
    .where(eq(packageVideos.videoId, videoId))
    .limit(1);

  return (
    <div className="container-page py-6 max-w-5xl">
      {pkgLink && (
        <Link
          href={`/dashboard/package/${pkgLink.packageId}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה ל{pkgLink.packageTitle}
        </Link>
      )}

      <WatchClient videoId={videoId} title={video.title} />

      <div className="mt-6">
        <h1 className="text-xl font-extrabold text-text">{video.title}</h1>
        {video.description && (
          <p className="mt-2 text-base text-text-muted leading-relaxed">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
}
