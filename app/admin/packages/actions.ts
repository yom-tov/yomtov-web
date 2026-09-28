"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateCoursePages } from "@/lib/admin/revalidate";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentPackages, packageVideos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  ContentPackageCreateSchema,
  ContentPackageUpdateSchema,
  PackageVideoAssignSchema,
  type ContentPackageCreateInput,
  type ContentPackageUpdateInput,
  type PackageVideoAssignInput,
} from "@/lib/admin/video-validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createPackageAction(
  input: ContentPackageCreateInput,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = ContentPackageCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const existing = await db
      .select({ id: contentPackages.id })
      .from(contentPackages)
      .where(eq(contentPackages.slug, parsed.data.slug))
      .limit(1);
    if (existing.length > 0) {
      return { ok: false, error: "Slug כבר קיים" };
    }
    await db.insert(contentPackages).values({
      slug: parsed.data.slug,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      priceDisplay: parsed.data.priceDisplay,
      displayOrder: parsed.data.displayOrder,
      published: parsed.data.published,
    });
    revalidatePath("/admin/packages");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updatePackageAction(
  id: string,
  input: ContentPackageUpdateInput,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = ContentPackageUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db
      .update(contentPackages)
      .set({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        priceDisplay: parsed.data.priceDisplay,
        displayOrder: parsed.data.displayOrder,
        published: parsed.data.published,
        updatedAt: new Date(),
      })
      .where(eq(contentPackages.id, id));
    revalidatePath("/admin/packages");
    revalidateCoursePages();
    revalidatePath(`/admin/packages/${id}/edit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deletePackageAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db.delete(contentPackages).where(eq(contentPackages.id, id));
    revalidatePath("/admin/packages");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function assignVideoToPackageAction(
  input: PackageVideoAssignInput,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = PackageVideoAssignSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db
      .insert(packageVideos)
      .values({
        packageId: parsed.data.packageId,
        videoId: parsed.data.videoId,
        displayOrder: parsed.data.displayOrder,
      })
      .onConflictDoUpdate({
        target: [packageVideos.packageId, packageVideos.videoId],
        set: { displayOrder: parsed.data.displayOrder },
      });
    revalidatePath(`/admin/packages/${parsed.data.packageId}/edit`);
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeVideoFromPackageAction(
  packageId: string,
  videoId: string,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db
      .delete(packageVideos)
      .where(
        and(
          eq(packageVideos.packageId, packageId),
          eq(packageVideos.videoId, videoId),
        ),
      );
    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const uuidList = z.array(z.string().uuid()).min(1).max(500);

/** videoIds in the new order — the first one becomes the free promo video. */
export async function reorderPackageVideosAction(packageId: string, videoIds: string[]): Promise<ActionResult> {
  try {
    await requireSession();
    const pid = z.string().uuid().parse(packageId);
    const ids = uuidList.parse(videoIds);
    const [first, ...rest] = ids.map((videoId, i) =>
      db
        .update(packageVideos)
        .set({ displayOrder: i + 1 })
        .where(and(eq(packageVideos.packageId, pid), eq(packageVideos.videoId, videoId))),
    );
    await db.batch([first, ...rest]);
    revalidatePath(`/admin/packages/${pid}/edit`);
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Package ids in the order they should appear on the site. */
export async function reorderPackagesAction(packageIds: string[]): Promise<ActionResult> {
  try {
    await requireSession();
    const ids = uuidList.parse(packageIds);
    const [first, ...rest] = ids.map((id, i) =>
      db.update(contentPackages).set({ displayOrder: i + 1, updatedAt: new Date() }).where(eq(contentPackages.id, id)),
    );
    await db.batch([first, ...rest]);
    revalidatePath("/admin/packages");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setPackagePublishedAction(id: string, published: boolean): Promise<ActionResult> {
  try {
    await requireSession();
    await db
      .update(contentPackages)
      .set({ published, updatedAt: new Date() })
      .where(eq(contentPackages.id, z.string().uuid().parse(id)));
    revalidatePath("/admin/packages");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
