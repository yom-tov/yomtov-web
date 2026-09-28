"use server";

import { revalidatePath } from "next/cache";
import { revalidateCoursePages } from "@/lib/admin/revalidate";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { getMuxClient } from "@/lib/mux/client";
import { eq } from "drizzle-orm";
import {
  VideoCreateSchema,
  VideoUpdateSchema,
  type VideoCreateInput,
  type VideoUpdateInput,
} from "@/lib/admin/video-validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createVideoAction(
  input: VideoCreateInput,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = VideoCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db.insert(videos).values({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      muxAssetId: parsed.data.muxAssetId,
      muxPlaybackId: parsed.data.muxPlaybackId,
      durationSeconds: parsed.data.durationSeconds ?? null,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      thumbnailTime: parsed.data.thumbnailTime ?? 0,
      displayOrder: parsed.data.displayOrder,
    });
    revalidatePath("/admin/videos");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateVideoAction(
  id: string,
  input: VideoUpdateInput,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  const parsed = VideoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    await db
      .update(videos)
      .set({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        muxAssetId: parsed.data.muxAssetId,
        muxPlaybackId: parsed.data.muxPlaybackId,
        durationSeconds: parsed.data.durationSeconds ?? null,
        thumbnailUrl: parsed.data.thumbnailUrl ?? null,
        thumbnailTime: parsed.data.thumbnailTime ?? 0,
        displayOrder: parsed.data.displayOrder,
      })
      .where(eq(videos.id, id));
    revalidatePath("/admin/videos");
    revalidateCoursePages();
    revalidatePath(`/admin/videos/${id}/edit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function syncVideoFromMuxAction(
  id: string,
): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    const [video] = await db
      .select({ muxAssetId: videos.muxAssetId })
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1);
    if (!video) return { ok: false, error: "סרטון לא נמצא" };

    const mux = getMuxClient();
    const asset = await mux.video.assets.retrieve(video.muxAssetId);

    await db
      .update(videos)
      .set({
        durationSeconds: asset.duration ? Math.round(asset.duration) : null,
      })
      .where(eq(videos.id, id));

    revalidatePath("/admin/videos");
    revalidateCoursePages();
    revalidatePath(`/admin/videos/${id}/edit`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteVideoAction(id: string, alsoFromMux = false): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    const [row] = await db.delete(videos).where(eq(videos.id, id)).returning({ muxAssetId: videos.muxAssetId });
    revalidatePath("/admin/videos");
    revalidateCoursePages();
    if (alsoFromMux && row?.muxAssetId) {
      // Only when no other video row still uses the same asset.
      const [other] = await db.select({ id: videos.id }).from(videos).where(eq(videos.muxAssetId, row.muxAssetId)).limit(1);
      if (!other) {
        try {
          await getMuxClient().video.assets.delete(row.muxAssetId);
        } catch (e) {
          return { ok: true, error: `הסרטון נמחק מהאתר, אבל לא מ-Mux: ${(e as Error).message}` };
        }
      }
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setVideoHiddenAction(id: string, hidden: boolean): Promise<ActionResult> {
  try {
    await requireSession();
    await db.update(videos).set({ hidden }).where(eq(videos.id, id));
    revalidatePath("/admin/videos");
    revalidateCoursePages();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
