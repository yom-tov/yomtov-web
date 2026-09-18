import type { Metadata } from "next";
import Link from "next/link";
import { requireUserSession } from "@/lib/user-auth";
import { getUserPackages } from "@/lib/admin/purchase-helpers";
import { db } from "@/lib/db";
import { users, packageVideos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { Play, ShoppingBag, User } from "lucide-react";

export const metadata: Metadata = {
  title: "האזור האישי שלי",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireUserSession();

  const [user] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);

  const packages = await getUserPackages(session.sub);

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-text">
              שלום, {user?.firstName ?? ""}!
            </h1>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-text mb-4">הקורסים שלי</h2>

      {packages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <DashboardPackageCard
              key={pkg.purchaseId}
              packageId={pkg.packageId}
              title={pkg.packageTitle}
              description={pkg.packageDescription}
              thumbnailUrl={pkg.packageThumbnailUrl}
              expiresAt={pkg.expiresAt}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-text-subtle" />
          <p className="mt-4 text-lg font-semibold text-text-subtle">
            אין לך קורסים עדיין
          </p>
          <p className="mt-1 text-sm text-text-subtle">
            עיין בקטלוג הקורסים שלנו ורכוש גישה
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary-700 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105"
          >
            <Play className="h-4 w-4" />
            לקטלוג הקורסים
          </Link>
        </div>
      )}
    </div>
  );
}

async function DashboardPackageCard({
  packageId,
  title,
  description,
  thumbnailUrl,
  expiresAt,
}: {
  packageId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  expiresAt: Date | null;
}) {
  const [countRow] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(packageVideos)
    .where(eq(packageVideos.packageId, packageId));

  const videoCount = countRow?.count ?? 0;

  return (
    <Link
      href={`/dashboard/package/${packageId}`}
      className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10"
    >
      {thumbnailUrl ? (
        <div className="aspect-video bg-surface-2 overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
          <Play className="h-10 w-10 text-primary-400" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-bold text-text group-hover:text-primary-700 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-text-muted line-clamp-2">
            {description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-text-subtle num">
            <Play className="h-3.5 w-3.5" />
            {videoCount} סרטונים
          </span>
          {expiresAt && (
            <span className="text-xs text-amber-600 num">
              עד {new Date(expiresAt).toLocaleDateString("he-IL")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
