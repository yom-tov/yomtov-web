import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUserSession } from "@/lib/user-auth";
import { hasActiveAccess, getPackageVideos } from "@/lib/admin/purchase-helpers";
import { db } from "@/lib/db";
import { contentPackages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Play, Clock, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPackagePage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  const session = await requireUserSession();

  const allowed = await hasActiveAccess(session.sub, packageId);
  if (!allowed) notFound();

  const [pkg] = await db
    .select({ title: contentPackages.title, description: contentPackages.description })
    .from(contentPackages)
    .where(eq(contentPackages.id, packageId))
    .limit(1);

  if (!pkg) notFound();

  const pkgVideos = await getPackageVideos(packageId);

  const formatDuration = (sec: number | null) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="container-page py-10 max-w-3xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        חזרה לאזור האישי
      </Link>

      <h1 className="text-2xl font-extrabold text-text">{pkg.title}</h1>
      {pkg.description && (
        <p className="mt-2 text-base text-text-muted">{pkg.description}</p>
      )}

      <div className="mt-6 space-y-2">
        {pkgVideos.map((v, i) => (
          <Link
            key={v.videoId}
            href={`/watch/${v.videoId}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700 group-hover:bg-primary-200 transition-colors num">
              {i + 1}
            </div>
            <Play className="h-5 w-5 shrink-0 text-primary-500 group-hover:text-primary-700 transition-colors" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-text group-hover:text-primary-700 transition-colors">
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
          </Link>
        ))}
      </div>
    </div>
  );
}
