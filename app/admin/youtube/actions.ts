"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { youtubeVideos } from "@/lib/db/schema";
import { COLLECTION_BY_ID, parseYoutubeId, type CollectionId } from "@/lib/site-content/youtube";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const collectionSchema = z.string().refine((c) => c in COLLECTION_BY_ID, "אוסף לא מוכר");

function revalidateCollection(collection: string) {
  const info = COLLECTION_BY_ID[collection as CollectionId];
  if (info) revalidatePath(info.page);
  revalidatePath("/admin/youtube");
}

/** Title (and author) of a YouTube video via the public oEmbed endpoint — no API key needed. */
async function oembed(youtubeId: string): Promise<{ title: string; author: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`,
      { cache: "no-store", signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { title?: string; author_name?: string };
    return j.title ? { title: j.title, author: j.author_name ?? "" } : null;
  } catch {
    return null;
  }
}

export async function lookupYoutubeAction(
  input: string,
): Promise<{ ok: boolean; error?: string; youtubeId?: string; isShort?: boolean; title?: string; author?: string }> {
  try {
    await requireSession();
    const parsed = parseYoutubeId(input);
    if (!parsed) return { ok: false, error: "לא זיהיתי קישור YouTube תקין" };
    const meta = await oembed(parsed.id);
    if (!meta) return { ok: false, error: "הסרטון לא נמצא ב-YouTube (או שהוא פרטי)", youtubeId: parsed.id };
    return { ok: true, youtubeId: parsed.id, isShort: parsed.isShort, title: meta.title, author: meta.author };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const AddSchema = z.object({
  collection: collectionSchema,
  url: z.string().min(1),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
});

export async function addYoutubeVideoAction(input: z.infer<typeof AddSchema>): Promise<ActionResult> {
  try {
    await requireSession();
    const d = AddSchema.parse(input);
    const parsed = parseYoutubeId(d.url);
    if (!parsed) return { ok: false, error: "לא זיהיתי קישור YouTube תקין" };
    let title = d.title?.trim();
    if (!title) title = (await oembed(parsed.id))?.title ?? "";
    if (!title) return { ok: false, error: "לא הצלחתי למשוך את שם הסרטון — כתוב כותרת ידנית" };

    const [{ top }] = await db
      .select({ top: max(youtubeVideos.displayOrder) })
      .from(youtubeVideos)
      .where(eq(youtubeVideos.collection, d.collection));
    const info = COLLECTION_BY_ID[d.collection as CollectionId];
    await db.insert(youtubeVideos).values({
      collection: d.collection,
      youtubeId: parsed.id,
      title: title.slice(0, 200),
      description: d.description?.trim() || null,
      isShort: parsed.isShort || Boolean(info.shorts),
      displayOrder: (top ?? 0) + 1,
    });
    revalidateCollection(d.collection);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const UpdateSchema = z.object({
  title: z.string().min(1, "חסרה כותרת").max(200),
  description: z.string().max(2000).nullable(),
  url: z.string().min(1),
});

export async function updateYoutubeVideoAction(id: string, input: z.infer<typeof UpdateSchema>): Promise<ActionResult> {
  try {
    await requireSession();
    const d = UpdateSchema.parse(input);
    const parsed = parseYoutubeId(d.url);
    if (!parsed) return { ok: false, error: "לא זיהיתי קישור YouTube תקין" };
    const [row] = await db
      .update(youtubeVideos)
      .set({ title: d.title, description: d.description?.trim() || null, youtubeId: parsed.id, updatedAt: new Date() })
      .where(eq(youtubeVideos.id, z.string().uuid().parse(id)))
      .returning({ collection: youtubeVideos.collection });
    if (row) revalidateCollection(row.collection);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setYoutubeHiddenAction(id: string, hidden: boolean): Promise<ActionResult> {
  try {
    await requireSession();
    const [row] = await db
      .update(youtubeVideos)
      .set({ hidden, updatedAt: new Date() })
      .where(eq(youtubeVideos.id, z.string().uuid().parse(id)))
      .returning({ collection: youtubeVideos.collection });
    if (row) revalidateCollection(row.collection);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteYoutubeVideoAction(id: string): Promise<ActionResult> {
  try {
    await requireSession();
    const [row] = await db
      .delete(youtubeVideos)
      .where(eq(youtubeVideos.id, z.string().uuid().parse(id)))
      .returning({ collection: youtubeVideos.collection });
    if (row) revalidateCollection(row.collection);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function reorderYoutubeAction(collection: string, ids: string[]): Promise<ActionResult> {
  try {
    await requireSession();
    const c = collectionSchema.parse(collection);
    const list = z.array(z.string().uuid()).min(1).max(500).parse(ids);
    const updates = list.map((id, i) =>
      db
        .update(youtubeVideos)
        .set({ displayOrder: i + 1 })
        .where(and(eq(youtubeVideos.id, id), eq(youtubeVideos.collection, c))),
    );
    const [first, ...rest] = updates;
    await db.batch([first, ...rest]);
    revalidateCollection(c);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
