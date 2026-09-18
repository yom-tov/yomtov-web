import { db } from "@/lib/db";
import { contentPackages, packageVideos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { PackagesListClient } from "./PackagesListClient";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const pkgs = await db
    .select({
      id: contentPackages.id,
      slug: contentPackages.slug,
      title: contentPackages.title,
      priceDisplay: contentPackages.priceDisplay,
      displayOrder: contentPackages.displayOrder,
      published: contentPackages.published,
      createdAt: contentPackages.createdAt,
      videoCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${packageVideos}
        WHERE ${packageVideos.packageId} = ${contentPackages.id}
      )`,
    })
    .from(contentPackages)
    .orderBy(contentPackages.displayOrder);

  return <PackagesListClient items={pkgs} />;
}
