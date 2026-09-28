import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PackageForm } from "@/components/admin/PackageForm";
import { PackageVideosClient } from "./PackageVideosClient";
import { PACKAGE_VIDEO_ORDER } from "@/lib/promo";
import { getSection } from "@/lib/site-content";
import { PageHeader } from "@/components/admin/ui/primitives";
import { Package } from "lucide-react";

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
      hidden: videos.hidden,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .where(eq(packageVideos.packageId, id))
    .orderBy(...PACKAGE_VIDEO_ORDER);

  const allVideos = await db
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
    })
    .from(videos)
    .orderBy(videos.displayOrder);

  const { promoMinutes } = await getSection("global.promo");
  const assignedIds = new Set(assignedVideos.map((v) => v.videoId));
  const availableVideos = allVideos.filter((v) => !assignedIds.has(v.id));

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        icon={<Package className="h-5 w-5" />}
        title="עריכת קורס"
        description={pkg.title}
        back={{ href: "/admin/packages", label: "לכל הקורסים" }}
      />
      <PackageForm mode="edit" initial={pkg} />

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-bold text-text">סרטונים בקורס</h2>
        <div className="mt-4">
          <PackageVideosClient
            key={assignedVideos.map((v) => `${v.videoId}:${v.displayOrder}`).join()}
            promoMinutes={promoMinutes}
            packageId={id}
            assignedVideos={assignedVideos}
            availableVideos={availableVideos}
          />
        </div>
      </div>
    </div>
  );
}
