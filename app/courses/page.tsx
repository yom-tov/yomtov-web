import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Play, ShoppingBag, Video, Sparkles, Mail, ArrowLeft } from "lucide-react";
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
      firstVideoThumbnail: sql<string | null>`(
        SELECT "videos"."thumbnail_url" FROM "package_videos"
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
      if (pkg.firstVideoThumbnail) return { ...pkg, muxThumbnailUrl: pkg.firstVideoThumbnail };
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

      {/* Private Zoom Lessons CTA */}
      <div className="mb-10 relative overflow-hidden rounded-2xl border border-primary-300/50 bg-gradient-to-bl from-primary-700 via-primary-600 to-accent-500 shadow-xl">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent-400/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative flex flex-col items-center gap-6 px-6 py-10 text-center sm:flex-row sm:text-right sm:py-8 sm:px-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 shadow-lg ring-1 ring-white/10">
            <Video className="h-10 w-10 text-white drop-shadow-sm" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/30 backdrop-blur-sm px-3 py-1 text-xs font-bold text-accent-100 mb-3 border border-accent-300/30">
              <Sparkles className="h-3.5 w-3.5" />
              שיעור אישי 1 על 1
            </div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl drop-shadow-sm">
              שיעורים פרטיים בזום
            </h2>
            <p className="mt-2 text-sm text-primary-100 max-w-lg leading-relaxed">
              למידה מותאמת אישית, בקצב שלך, עם הסברים ברורים ומפורטים.
              מתאים להכנה למבחנים, השלמת פערים, או העמקה בנושאים מורכבים.
            </p>
          </div>
          <a
            href="mailto:lessons@yomtovian.com"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary-700 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent-400/20"
          >
            <Mail className="h-4.5 w-4.5" />
            לפרטים ותיאום
            <ArrowLeft className="h-4 w-4" />
          </a>
        </div>
        <div className="relative border-t border-white/15 bg-white/10 backdrop-blur-sm px-6 py-4 text-center sm:px-10 sm:text-right">
          <span className="text-lg text-white font-bold tracking-wide">
            <Mail className="inline h-5 w-5 ml-2 -mt-0.5" />
            lessons@yomtovian.com
          </span>
        </div>
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
