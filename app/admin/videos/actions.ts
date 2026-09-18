"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
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
      thumbnailTime: parsed.data.thumbnailTime ?? 0,
      displayOrder: parsed.data.displayOrder,
    });
    revalidatePath("/admin/videos");
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
        thumbnailTime: parsed.data.thumbnailTime ?? 0,
        displayOrder: parsed.data.displayOrder,
      })
      .where(eq(videos.id, id));
    revalidatePath("/admin/videos");
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

    const { getMuxClient } = await import("@/lib/mux/client");
    const mux = getMuxClient();
    const asset = await mux.video.assets.retrieve(video.muxAssetId);

    await db
      .update(videos)
      .set({
        durationSeconds: asset.duration ? Math.round(asset.duration) : null,
      })
      .where(eq(videos.id, id));

    revalidatePath("/admin/videos");
    revalidatePath(`/admin/videos/${id}/edit`);
    revalidatePath("/courses");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteVideoAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
  } catch {
    return { ok: false, error: "לא מאומת" };
  }
  try {
    await db.delete(videos).where(eq(videos.id, id));
    revalidatePath("/admin/videos");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
