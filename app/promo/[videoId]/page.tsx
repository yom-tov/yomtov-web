import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { videos, packageVideos, contentPackages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { PromoClient } from "./PromoClient";

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
  if (!video) return {};
  return {
    title: `פרומו - ${video.title}`,
    description: `צפו ב-30 הדקות הראשונות של ${video.title} בחינם`,
  };
}

export default async function PromoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  const [video] = await db
    .select({
      id: videos.id,
      title: videos.title,
      durationSeconds: videos.durationSeconds,
    })
    .from(videos)
    .where(eq(videos.id, videoId))
    .limit(1);

  if (!video) notFound();

  const [link] = await db
    .select({
      packageId: packageVideos.packageId,
      displayOrder: packageVideos.displayOrder,
    })
    .from(packageVideos)
    .where(
      and(
        eq(packageVideos.videoId, videoId),
        eq(packageVideos.displayOrder, 1),
      ),
    )
    .limit(1);

  if (!link) notFound();

  const [pkg] = await db
    .select({
      slug: contentPackages.slug,
      title: contentPackages.title,
    })
    .from(contentPackages)
    .where(eq(contentPackages.id, link.packageId))
    .limit(1);

  if (!pkg) notFound();

  return (
    <div className="container-page py-10">
      <Link
        href={`/courses/${pkg.slug}`}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לדף הקורס
      </Link>

      <div className="max-w-4xl mx-auto">
        <PromoClient videoId={video.id} title={video.title} />

        <div className="mt-6 rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/60 to-surface p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-amber-900">
                צפייה בפרומו - 30 דקות ראשונות בחינם
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                אתם צופים ב-30 הדקות הראשונות של{" "}
                <span className="font-semibold">{video.title}</span> מתוך
                הקורס{" "}
                <Link
                  href={`/courses/${pkg.slug}`}
                  className="font-semibold text-primary-700 hover:underline"
                >
                  {pkg.title}
                </Link>
                . לצפייה בתוכן המלא, הירשמו ורכשו גישה לקורס.
              </p>
              {video.durationSeconds && (
                <div className="mt-2 flex items-center gap-1 text-xs text-text-subtle">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    משך הסרטון המלא:{" "}
                    {Math.floor(video.durationSeconds / 3600) > 0
                      ? `${Math.floor(video.durationSeconds / 3600)}:${String(Math.floor((video.durationSeconds % 3600) / 60)).padStart(2, "0")}:${String(video.durationSeconds % 60).padStart(2, "0")}`
                      : `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")}`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
            >
              הרשמה לרכישת הקורס המלא
            </Link>
            <Link
              href={`/courses/${pkg.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-2 transition"
            >
              פרטים נוספים על הקורס
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
