// YouTube videos shown on the public site, grouped in collections. Stored in
// the youtube_videos table; youtube-defaults.json holds what the pages showed
// before the admin existed (used to seed the table and as a fallback when the
// database is unreachable).

import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { youtubeVideos } from "@/lib/db/schema";
import defaults from "./youtube-defaults.json";

export type CollectionId = "digital-main" | "digital-shorts" | "math" | "physics-main" | "physics" | "psychometric";

export interface CollectionInfo {
  id: CollectionId;
  title: string;
  description: string;
  page: string;
  /** Only the first visible video is used (e.g. a page's main video). */
  single?: boolean;
  /** Vertical YouTube Shorts. */
  shorts?: boolean;
}

export const COLLECTIONS: CollectionInfo[] = [
  { id: "digital-main", title: "ספרתית — סרטון ראשי", description: "הסרטון הגדול בראש דף אלקטרוניקה ספרתית", page: "/digital", single: true },
  { id: "digital-shorts", title: "ספרתית — Shorts", description: "שורת הסרטונים הקצרים בדף ספרתית", page: "/digital", shorts: true },
  { id: "math", title: "מתמטיקה — סרטוני הדרכה", description: "הרשת של סרטוני ההדרכה בדף מתמטיקה", page: "/math", shorts: true },
  { id: "physics-main", title: "פיסיקה — סרטון ראשי", description: "הסרטון הגדול בראש דף פיסיקה", page: "/physics", single: true },
  { id: "physics", title: "פיסיקה — סרטוני הדרכה", description: "הרשת של סרטוני ההדרכה בדף פיסיקה", page: "/physics" },
  { id: "psychometric", title: "פסיכומטרי", description: "הסרטונים בדף פסיכומטרי", page: "/psychometric" },
];

export const COLLECTION_BY_ID = Object.fromEntries(COLLECTIONS.map((c) => [c.id, c])) as Record<CollectionId, CollectionInfo>;

export interface YoutubeItem {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  isShort: boolean;
}

type Seed = { youtubeId: string; title: string };

// Shared with scripts/seed-youtube.mjs (the one-time import into the DB).
export const DEFAULT_VIDEOS = defaults as Record<CollectionId, Seed[]>;

function fallback(id: CollectionId): YoutubeItem[] {
  const shorts = Boolean(COLLECTION_BY_ID[id].shorts);
  return DEFAULT_VIDEOS[id].map((v, i) => ({
    id: `${id}-${i}`,
    youtubeId: v.youtubeId,
    title: v.title,
    description: null,
    isShort: shorts,
  }));
}

/** Visible videos of a collection, in display order. */
export const getCollection = cache(async (id: CollectionId): Promise<YoutubeItem[]> => {
  try {
    const rows = await db
      .select()
      .from(youtubeVideos)
      .where(and(eq(youtubeVideos.collection, id), eq(youtubeVideos.hidden, false)))
      .orderBy(asc(youtubeVideos.displayOrder), asc(youtubeVideos.createdAt));
    return rows.map((r) => ({
      id: r.id,
      youtubeId: r.youtubeId,
      title: r.title,
      description: r.description,
      isShort: r.isShort,
    }));
  } catch (e) {
    console.error(`[youtube] falling back to defaults for ${id}:`, (e as Error).message);
    return fallback(id);
  }
});

/** Accepts a bare id or any YouTube URL form (watch, youtu.be, shorts, embed). */
export function parseYoutubeId(input: string): { id: string; isShort: boolean } | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return { id: s, isShort: false };
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1, 12);
      return /^[\w-]{11}$/.test(id) ? { id, isShort: false } : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return { id: v, isShort: false };
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{11})/);
      if (m) return { id: m[2], isShort: m[1] === "shorts" };
    }
  } catch {
    // not a URL
  }
  return null;
}
