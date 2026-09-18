import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Play, ShoppingBag } from "lucide-react";
import { signThumbnailToken } from "@/lib/mux/playback";

export const metadata: Metadata = {
  title: "קורסים ותכנים בתשלום",
  description:
    "קורסי וידאו מקצועיים בחשמל ואלקטרוניקה - שיעורים מוסברים ומפורטים מאת אבי יומטוביאן",
};

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const packages = await db
    .select({
      id: contentPackages.id,
      slug: contentPackages.slug,
      title: contentPackages.title,
      description: contentPackages.description,
      thumbnailUrl: contentPackages.thumbnailUrl,
      priceDisplay: contentPackages.priceDisplay,
      videoCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${packageVideos}
        WHERE ${packageVideos.packageId} = ${contentPackages.id}
      )`,
      firstPlaybackId: sql<string | null>`(
        SELECT "videos"."mux_playback_id" FROM "package_videos"
        INNER JOIN "videos" ON "videos"."id" = "package_videos"."video_id"
        WHERE "package_videos"."package_id" = "content_packages"."id"
        ORDER BY "package_videos"."display_order" LIMIT 1
      )`,
    })
    .from(contentPackages)
    .where(eq(contentPackages.published, true))
    .orderBy(contentPackages.displayOrder);

  const packagesWithThumbnails = await Promise.all(
    packages.map(async (pkg) => {
      if (pkg.thumbnailUrl) return { ...pkg, muxThumbnailUrl: null };
      if (!pkg.firstPlaybackId) return { ...pkg, muxThumbnailUrl: null };
      try {
        const token = await signThumbnailToken(pkg.firstPlaybackId);
        return {
          ...pkg,
          muxThumbnailUrl: `https://image.mux.com/${pkg.firstPlaybackId}/thumbnail.png?token=${token}&width=640&height=360`,
        };
      } catch (e) {
        console.error("signThumbnailToken failed:", e);
        return { ...pkg, muxThumbnailUrl: null };
      }
    }),
  );

  return (
    <div className="container-page py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-text sm:text-4xl">
          קורסים ותכנים בתשלום
        </h1>
        <p className="mt-3 text-base text-text-muted max-w-xl mx-auto">
          שיעורי וידאו מקצועיים מאת אבי יומטוביאן - הסברים ברורים ומפורטים
          שיעזרו לך להצליח בלימודים
        </p>
      </div>

      {packagesWithThumbnails.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packagesWithThumbnails.map((pkg) => (
            <Link
              key={pkg.id}
              href={`/courses/${pkg.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10"
            >
              {(pkg.thumbnailUrl || pkg.muxThumbnailUrl) ? (
                <div className="aspect-video bg-surface-2 overflow-hidden">
                  <img
                    src={(pkg.thumbnailUrl || pkg.muxThumbnailUrl)!}
                    alt={pkg.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                  <Play className="h-12 w-12 text-primary-400" />
                </div>
              )}
              <div className="p-5">
                <h2 className="text-lg font-bold text-text group-hover:text-primary-700 transition-colors">
                  {pkg.title}
                </h2>
                {pkg.description && (
                  <p className="mt-2 text-sm text-text-muted line-clamp-2">
                    {pkg.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-sm text-text-subtle">
                    <Play className="h-4 w-4" />
                    {pkg.videoCount} סרטונים
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-700">
                    <ShoppingBag className="h-4 w-4" />
                    {pkg.priceDisplay}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-text-subtle" />
          <p className="mt-4 text-lg font-semibold text-text-subtle">
            קורסים חדשים בקרוב!
          </p>
          <p className="mt-1 text-sm text-text-subtle">
            אנחנו עובדים על תכנים חדשים. חזרו בקרוב.
          </p>
        </div>
      )}
    </div>
  );
}
