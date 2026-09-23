import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { contentPackages, packageVideos, videos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Play, Lock, Clock, ArrowLeft, ShoppingBag, CheckCircle, ExternalLink, Sparkles } from "lucide-react";
import { signThumbnailToken } from "@/lib/mux/playback";
import { getOptionalUserSession } from "@/lib/user-auth";
import { hasActiveAccess } from "@/lib/admin/purchase-helpers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [pkg] = await db
    .select({ title: contentPackages.title, description: contentPackages.description })
    .from(contentPackages)
    .where(eq(contentPackages.slug, slug))
    .limit(1);
  if (!pkg) return {};
  return {
    title: pkg.title,
    description: pkg.description ?? `קורס ${pkg.title} מאת אבי יומטוביאן`,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [pkg] = await db
    .select()
    .from(contentPackages)
    .where(eq(contentPackages.slug, slug))
    .limit(1);

  if (!pkg || !pkg.published) notFound();

  const session = await getOptionalUserSession();
  const isLoggedIn = !!session;
  const isOwned = session ? await hasActiveAccess(session.sub, pkg.id) : false;

  const pkgVideos = await db
    .select({
      videoId: videos.id,
      videoTitle: videos.title,
      videoDescription: videos.description,
      durationSeconds: videos.durationSeconds,
      muxPlaybackId: videos.muxPlaybackId,
      thumbnailUrl: videos.thumbnailUrl,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .where(eq(packageVideos.packageId, pkg.id))
    .orderBy(packageVideos.displayOrder);

  const totalDuration = pkgVideos.reduce(
    (sum, v) => sum + (v.durationSeconds ?? 0),
    0,
  );
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMins = Math.ceil((totalDuration % 3600) / 60);
  const totalDurationLabel =
    totalHours > 0
      ? totalMins > 0
        ? `${totalHours} שעות ו-${totalMins} דקות תוכן`
        : `${totalHours} שעות תוכן`
      : `${totalMins} דקות תוכן`;

  let thumbnailUrl: string | null = null;
  const firstVideo = pkgVideos[0];
  if (firstVideo?.thumbnailUrl) {
    thumbnailUrl = firstVideo.thumbnailUrl;
  } else if (firstVideo?.muxPlaybackId) {
    try {
      const token = await signThumbnailToken(firstVideo.muxPlaybackId);
      thumbnailUrl = `https://image.mux.com/${firstVideo.muxPlaybackId}/thumbnail.png?token=${token}&width=960&height=540`;
    } catch (e) {
      console.error("signThumbnailToken failed:", e);
    }
  }

  const formatDuration = (sec: number | null) => {
    if (!sec) return "";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="container-page py-10">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לכל הקורסים
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {pkg.thumbnailUrl || thumbnailUrl ? (
            <div className="aspect-video overflow-hidden rounded-2xl bg-surface-2">
              <img
                src={(pkg.thumbnailUrl || thumbnailUrl)!}
                alt={pkg.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
              <Play className="h-16 w-16 text-primary-400" />
            </div>
          )}
          <h1 className="mt-6 text-2xl font-extrabold text-text sm:text-3xl">
            {pkg.title}
          </h1>
          {pkg.description && (
            <p className="mt-3 text-base text-text-muted leading-relaxed">
              {pkg.description}
            </p>
          )}

          {/* Video list */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-text mb-4">
              תוכן הקורס ({pkgVideos.length} סרטונים)
            </h2>
            <div className="space-y-2">
              {pkgVideos.map((v, i) => (
                <div
                  key={v.videoId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-text-muted num">
                    {i + 1}
                  </div>
                  <Lock className="h-4 w-4 shrink-0 text-text-subtle" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text">
                      {v.videoTitle}
                    </div>
                    {v.videoDescription && (
                      <div className="mt-0.5 text-xs text-text-subtle line-clamp-1">
                        {v.videoDescription}
                      </div>
                    )}
                  </div>
                  {v.durationSeconds && (
                    <span className="text-xs text-text-subtle num flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(v.durationSeconds)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {isOwned ? (
            <div className="sticky top-24 rounded-2xl border border-emerald-300 bg-gradient-to-b from-emerald-50/60 to-surface p-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-emerald-800">
                  הקורס בבעלותך
                </h3>
                <p className="mt-2 text-sm text-text-muted">
                  {pkgVideos.length} סרטונים · {totalDurationLabel}
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  עבור לצפייה בסרטונים
                </Link>
              </div>
              <div className="mt-4 text-xs text-text-subtle text-center">
                הקורס זמין באזור האישי שלך.
                <br />
                לחץ למעלה כדי לצפות בסרטונים.
              </div>
            </div>
          ) : (
            <div className="sticky top-24 space-y-4">
              {/* Promo banner */}
              {firstVideo && (
                <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-amber-50/30 p-5">
                  <div className="flex items-center gap-2 justify-center">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <h3 className="text-base font-extrabold text-amber-900">
                      30 דקות ראשונות בחינם
                    </h3>
                  </div>
                  <p className="mt-2 text-center text-sm text-amber-800/80">
                    רוצים לראות את איכות ההוראה לפני שרוכשים? צפו בפרומו ללא
                    עלות ובלי הרשמה.
                  </p>
                  <Link
                    href={`/promo/${firstVideo.videoId}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-amber-600 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-md hover:brightness-105 transition"
                  >
                    <Play className="h-4 w-4" />
                    צפייה בפרומו חינם
                  </Link>
                </div>
              )}

              {/* Purchase card */}
              <div className="rounded-2xl border border-primary-200 bg-gradient-to-b from-primary-50/60 to-surface p-6">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-primary-700 num">
                    {pkg.priceDisplay}
                  </div>
                  <p className="mt-2 text-sm text-text-muted">
                    {pkgVideos.length} סרטונים · {totalDurationLabel}
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  {isLoggedIn ? (
                    <>
                      <div className="rounded-xl border border-primary-100 bg-primary-50/50 px-4 py-3 text-center text-sm text-primary-800">
                        לרכישת הקורס, פנה אלינו בהודעת Bit או במייל
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text hover:bg-surface-2 transition"
                      >
                        לאזור האישי
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/register"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        הרשמה לרכישה
                      </Link>
                      <Link
                        href="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-text hover:bg-surface-2 transition"
                      >
                        כבר רשום? התחבר
                      </Link>
                    </>
                  )}
                </div>
                {!isLoggedIn && (
                  <div className="mt-5 text-xs text-text-subtle text-center">
                    לאחר ההרשמה, ניתן לרכוש גישה דרך Bit.
                    <br />
                    הגישה תופעל באופן ידני תוך שעות ספורות.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
