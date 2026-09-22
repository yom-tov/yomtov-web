import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import {
  videos,
  contentPackages,
  packageVideos,
} from "../lib/db/schema.ts";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const db = drizzle(sql);

const COURSE_SLUG = "intro-ac-current";

const VIDEO_DATA = [
  {
    num: 1,
    title: "חשמל 2026 חלק 1 - תרגילים ראשוניים",
    assetId: "7rXH4xCuiEGqV9Ref02AiMBlPjPZWIlf01BqpHKiG00Buo",
    playbackId: "B8Kf2uj758morcu6s5hOL7fhlg2kS4m0001NCwW1MOhNA",
    durationSeconds: 8951, // 2:29:11
  },
  {
    num: 2,
    title: "חשמל 2026 חלק 2 - הכרת נוסחאות היסוד ותירגולן",
    assetId: "oIXJ1y029c9rpybtrLZ50102BO9ImgAFtNI6Se2my02IHeE",
    playbackId: "X01W3jxqkeQaNQNESOg1nuQWGaqczX6WAw9D9F01nPegs",
    durationSeconds: 13416, // 3:43:36
  },
  {
    num: 3,
    title: "חשמל 2026 חלק 3 - מעגלים מעורבים, מקם הספק ושיפורו, משפט מילמן",
    assetId: "jMYKshXU301SpD413W9vhrKOuvKvGp7YZ6wfKFcqLzDI",
    playbackId: "XoHlGBctupVmLOC8uiYZ300BvPeu9P8s3M483j53LqpE",
    durationSeconds: 10656, // 2:57:36
  },
  {
    num: 4,
    title: "חשמל 2026 חלק 4 - משפט מילמן, מתחי צמתים, מציאת כיוון הזרם האמיתי",
    assetId: "j1bh3z1BKKV66A02x9uGDgTGt7B9f6izYnRl01IqwAQWk",
    playbackId: "DenpluhWr5ZciCo4DQ1dGdzx01kfD9SZ01e1wFmNa02Fyg",
    durationSeconds: 8831, // 2:27:11
  },
  {
    num: 5,
    title: "חשמל 2026 חלק 5 - תאוריה-מה עומד מאחורי הנוסחאות",
    assetId: "tTzcwKJ1PY3a01Q101FhctyDJ99ZYqdqopN6y7bFQXQ9A",
    playbackId: "vdBTYabpsi4xtQ023HkVtuVphE5Re2DcbnD1QbkQR02R00",
    durationSeconds: null, // still preparing
  },
  {
    num: 6,
    title: "חשמל 2026 חלק 6 - שיפור מקדם הספק במעגל פשוט",
    assetId: "dGN6ykMJ77KKfEXswPecGc3s63yEgFg00PXJL4KpqOao",
    playbackId: "kntC02lK7M11WDQZMcpI3q4JJgwwGpN02ArVW9TNZ474M",
    durationSeconds: 2860, // 0:47:40
  },
  {
    num: 7,
    title: "חשמל 2026 חלק 7 - מודל חתונה (חיבור וקטורי)",
    assetId: "eU8tx2Ywoz6ZwXiJaW01DsCs4vg01Ma5nh76IP5aqlb5g",
    playbackId: "01mXeX2qLnZn99TFTyMcy88ody9v1pkfTcAbpGLbuIDg",
    durationSeconds: 2947, // 0:49:07
  },
  {
    num: 8,
    title: "חשמל 2026 חלק 8 - שיפור מקדם הספק במפעל",
    assetId: "Xo17qA4mNkW7f00ZarDD7hQIjQzs001i44QhmrYTExQxk",
    playbackId: "MugSchV00OHcSy6iiBJSlO8bbHGQ01202M2acHHZVvbvMQ",
    durationSeconds: 1503, // 0:25:03
  },
  {
    num: 9,
    title: "חשמל 2026 חלק 9 - זרמי חוגים + אלגברה",
    assetId: "QJsOySnZQ3zAQYTeJi4E01PVpEYTvFHx6z536vGbmruk",
    playbackId: "zuYGdYDdB314zmHjjWR00JwixcoxLu9N01EkzHaqbpZd4",
    durationSeconds: 2395, // 0:39:55
  },
];

async function main() {
  // 1. Find the package
  const [pkg] = await db
    .select({ id: contentPackages.id, title: contentPackages.title })
    .from(contentPackages)
    .where(eq(contentPackages.slug, COURSE_SLUG))
    .limit(1);

  if (!pkg) {
    console.error(`Package with slug "${COURSE_SLUG}" not found!`);
    process.exit(1);
  }
  console.log(`Found package: "${pkg.title}" (${pkg.id})`);

  // 2. Check existing videos for this package
  const existingPkgVideos = await db
    .select({
      videoId: packageVideos.videoId,
      playbackId: videos.muxPlaybackId,
      title: videos.title,
    })
    .from(packageVideos)
    .innerJoin(videos, eq(packageVideos.videoId, videos.id))
    .where(eq(packageVideos.packageId, pkg.id));

  const existingPlaybackIds = new Set(existingPkgVideos.map((v) => v.playbackId));
  console.log(`Existing videos in package: ${existingPkgVideos.length}`);
  for (const v of existingPkgVideos) {
    console.log(`  - ${v.title} (${v.playbackId})`);
  }

  // 3. Insert missing videos and link to package
  let added = 0;
  for (const vd of VIDEO_DATA) {
    if (existingPlaybackIds.has(vd.playbackId)) {
      console.log(`[SKIP] Video #${vd.num} already exists: "${vd.title}"`);

      // Still update display order for existing video
      const existing = existingPkgVideos.find((v) => v.playbackId === vd.playbackId);
      if (existing) {
        await db
          .update(packageVideos)
          .set({ displayOrder: vd.num })
          .where(
            eq(packageVideos.videoId, existing.videoId),
          );
        console.log(`  Updated display order to ${vd.num}`);
      }
      continue;
    }

    // Insert video record
    const [newVideo] = await db
      .insert(videos)
      .values({
        title: vd.title,
        description: null,
        muxAssetId: vd.assetId,
        muxPlaybackId: vd.playbackId,
        durationSeconds: vd.durationSeconds,
        thumbnailUrl: null,
        thumbnailTime: 0,
        displayOrder: vd.num,
      })
      .returning({ id: videos.id });

    console.log(`[ADD] Video #${vd.num}: "${vd.title}" → ${newVideo.id}`);

    // Link to package
    await db.insert(packageVideos).values({
      packageId: pkg.id,
      videoId: newVideo.id,
      displayOrder: vd.num,
    });

    console.log(`  Linked to package with displayOrder=${vd.num}`);
    added++;
  }

  console.log(`\nDone! Added ${added} new videos, total ${existingPkgVideos.length + added} videos in package.`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
