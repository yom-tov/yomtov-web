import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PackageForm } from "@/components/admin/PackageForm";
import { PackageVideosClient } from "./PackageVideosClient";

export const dynamic = "force-dynamic";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pkg] = await db
    .select()
    .from(contentPackages)
    .where(eq(contentPackages.id, id))
    .limit(1);

  if (!pkg) notFound();

  const assignedVideos = await db
    .select({
      videoId: videos.id,
      videoTitle: videos.title,
      muxPlaybackId: videos.muxPlaybackId,
      durationSeconds: videos.durationSeconds,
      displayOrder: packageVideos.displayOrder,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .where(eq(packageVideos.packageId, id))
    .orderBy(packageVideos.displayOrder);

  const allVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
    })
    .from(videos)
    .orderBy(videos.displayOrder);

  const assignedIds = new Set(assignedVideos.map((v) => v.videoId));
  const availableVideos = allVideos.filter((v) => !assignedIds.has(v.id));

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text">עריכת חבילה</h1>
        <p className="mt-1 text-sm text-text-muted num">{pkg.title}</p>
      </div>
      <PackageForm mode="edit" initial={pkg} />

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-bold text-text">סרטונים בחבילה</h2>
        <p className="mt-1 text-sm text-text-muted">
          שייך סרטונים לחבילה זו. הסרטונים יוצגו בסדר שנקבע.
        </p>
        <div className="mt-4">
          <PackageVideosClient
            packageId={id}
            assignedVideos={assignedVideos}
            availableVideos={availableVideos}
          />
        </div>
      </div>
    </div>
  );
}
