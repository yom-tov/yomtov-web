import { readFileSync } from "fs";
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)/);
  if (m) process.env[m[1]] = m[2];
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { contentPackages, videos, packageVideos } from "../lib/db/schema.ts";

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

// ── Course definitions ──

const COURSES = [
  {
    slug: "thevenin-norton",
    title: "תבנין / נורטון",
    description: "קורס מקיף על משפטי תבנין ונורטון - תאוריה, תרגילים ותרגילים מתקדמים",
    priceDisplay: "T.B.D",
    displayOrder: 2,
    videos: [
      {
        title: "תבנין/נורטון - תאוריה, מרתון תרגילים",
        muxAssetId: "BGseQzQhplmvpmHas00Mub8C47cDZJ01iHjsjvahJkcAY",
        muxPlaybackId: "qgYvmDSwO6sH902hSbDAVTq2IJMMNvTGPg2S6RaDayRE",
        durationSeconds: 8270, // 2:17:50
        displayOrder: 1,
      },
      {
        title: "תבנין/נורטון - תרגילים מתקדמים",
        muxAssetId: "tLzZCRhXXViIFEfbSFiS4E8vGZHcuyFm11P025YiDcTs",
        muxPlaybackId: "vqZsGUSc01BfDgcLM27bf00EgowppDsHFJtKZ4ygnCSV00",
        durationSeconds: 7052, // 1:57:32
        displayOrder: 2,
      },
    ],
  },
  {
    slug: "magnetic-circuits",
    title: "מעגלים מגנטיים",
    description: "מרתון תאוריה ותרגילים במעגלים מגנטיים - שני חלקים מקיפים",
    priceDisplay: "T.B.D",
    displayOrder: 3,
    videos: [
      {
        title: "מרתון תאוריה ותרגילים - חלק 1",
        muxAssetId: "6VzCdN02bJhrRxDWg00BSBnGFaat5U7FvWbLMNMnFueaU",
        muxPlaybackId: "oLcvsRK69HoOAqYhA1k5VxrqDI9XsJyUAsqUu00V3REE",
        durationSeconds: 12115, // 3:21:55
        displayOrder: 1,
      },
      {
        title: "מרתון תאוריה ותרגילים - חלק 2",
        muxAssetId: "L2PTcReRcvo4qlrW4I5i8ESIwUtS7fDZB00cXvm1xugw",
        muxPlaybackId: "ceZc3UwhJYLsXekcaIV64pP4l02PZGP30102eJ3gbAhdmY",
        durationSeconds: 11094, // 3:04:54
        displayOrder: 2,
      },
    ],
  },
  {
    slug: "three-phase",
    title: "מרתון תלת פאזי",
    description: "קורס מקיף על תלת פאזי - תאוריה, תרגילים מהקל אל הכבד ותרגילים מתקדמים",
    priceDisplay: "T.B.D",
    displayOrder: 4,
    videos: [
      {
        title: "מרתון תאוריה ותרגילים - חלק 1",
        muxAssetId: "vSUI02G4vmqFuSK02BQARhwb8AidgrepOplhVcnxNwHWM",
        muxPlaybackId: "l5GGxoyBddWkhBKyMo02Kq5VogokDj01DKzWsw8KcRjpI",
        durationSeconds: null, // still processing
        displayOrder: 1,
      },
      {
        title: "מרתון תרגילים מהקל אל הכבד - חלק 2",
        muxAssetId: "wFtL9JikFQSZUhpbbMvAGq9h7k7zPNGmGHVeLbXXZ2k",
        muxPlaybackId: "fjR6DxUiq009m9slmWBPyetkC14RcOwrnX39Il8aJTKk",
        durationSeconds: 11880, // 3:18:00
        displayOrder: 2,
      },
      {
        title: "מרתון תרגילים מתקדמים - חלק 3",
        muxAssetId: "Y02C1Ot3i02Uj6a801KPLmJlkR6cY5reXzuYue7HeU1WXU",
        muxPlaybackId: "CqAC3XjbsLGnD18Bv02QOCbBm8Sa02qvf00gcn9rxNg8CY",
        durationSeconds: 6793, // 1:53:13
        displayOrder: 3,
      },
    ],
  },
  {
    slug: "resonance-circuits",
    title: "מעגלי תהודה",
    description: "קורס מקיף על מעגלי תהודה - יסודות, תהודה טורית ומקבילית, גורם טיב ועוד",
    priceDisplay: "T.B.D",
    displayOrder: 5,
    videos: [
      {
        title: "יסודות התהודה בקצרה - הכרת הנוסחאון",
        muxAssetId: "KewgmTlklO01xAoSuPBE5Vo9Foy3LLBBPHC1BdQ3cD01w",
        muxPlaybackId: "QTdJ9SltsmsGb500oUnPr65Evv01BzldRDRVYPQqb2GRo",
        durationSeconds: 1735, // 0:28:55
        displayOrder: 1,
      },
      {
        title: "תהודה מקבילית ב-3 צורותיה",
        muxAssetId: "eCm8wCi6501CIcfgFxjlW5qZV65wVOzGJkHEkft8pNAM",
        muxPlaybackId: "QndxNtg8lcldKzqTU02arHmoF32RlL02qeIMw4JOc2ibU",
        durationSeconds: 3727, // 1:02:07
        displayOrder: 2,
      },
      {
        title: "תהודה מקבילית מעשית עם טמפרטורה",
        muxAssetId: "1uQBAA2SED2UHpMTiLsvg6B601MUCBrmeSYriEbIGbeo",
        muxPlaybackId: "jNoORMRHfBuF4THtDIM00BH6ODpEIJvhlI9Q76gXqp7I",
        durationSeconds: 1964, // 0:32:44
        displayOrder: 3,
      },
      {
        title: "כתיבת ביטוי למתירות+מצב מתמיד",
        muxAssetId: "7up183WelopWQQrKG8PyL01OXZc4Itof1W33pkk02VeGY",
        muxPlaybackId: "Umsn00LK58KWbhOICx8I8VQluubIepnvs7QDF1UVmRxA",
        durationSeconds: 2399, // 0:39:59
        displayOrder: 4,
      },
      {
        title: "תהודה טורית ומקבילית באותו מעגל",
        muxAssetId: "y5z9Sd3K7LRMwY202zDfMZemVwRGPUjO0202x4nkqAbHU8",
        muxPlaybackId: "GHhyQhlQLWEcuz01MMBo9t3gwa01nAGA5X79M01kcsoYjs",
        durationSeconds: 3037, // 0:50:37
        displayOrder: 5,
      },
      {
        title: "גורם טיב, רוחב פס",
        muxAssetId: "u1jqlT2KpMRuInKD3SE9uNqOEglvwQr01LLdDxKuk300A",
        muxPlaybackId: "1m1k4kTV8pARvALr3ml6AuEdqd5lWEBWtnLbRYYzBpk",
        durationSeconds: 2297, // 0:38:17
        displayOrder: 6,
      },
      {
        title: "מעגל מעורב שהופך לתהודה טורית",
        muxAssetId: "BdN6fb6P3kMyOUk8c7TEGcIoGkQw9186Fw1eNG7XiZ8",
        muxPlaybackId: "5RJTVFo3pXGRgSMus028jupBeA7VyWY01844501p00iEP3I",
        durationSeconds: 1369, // 0:22:49
        displayOrder: 7,
      },
    ],
  },
];

// ── Execute ──

async function main() {
  for (const course of COURSES) {
    console.log(`\n📦 Creating package: ${course.title} (${course.slug})`);

    // Create package
    const [pkg] = await db
      .insert(contentPackages)
      .values({
        slug: course.slug,
        title: course.title,
        description: course.description,
        priceDisplay: course.priceDisplay,
        displayOrder: course.displayOrder,
        published: true,
      })
      .returning({ id: contentPackages.id });

    console.log(`   Package ID: ${pkg.id}`);

    // Create videos and link them
    for (const vid of course.videos) {
      const [v] = await db
        .insert(videos)
        .values({
          title: vid.title,
          muxAssetId: vid.muxAssetId,
          muxPlaybackId: vid.muxPlaybackId,
          durationSeconds: vid.durationSeconds,
          displayOrder: vid.displayOrder,
        })
        .returning({ id: videos.id });

      await db.insert(packageVideos).values({
        packageId: pkg.id,
        videoId: v.id,
        displayOrder: vid.displayOrder,
      });

      const dur = vid.durationSeconds
        ? `${Math.floor(vid.durationSeconds / 3600)}:${String(Math.floor((vid.durationSeconds % 3600) / 60)).padStart(2, "0")}:${String(vid.durationSeconds % 60).padStart(2, "0")}`
        : "processing";
      console.log(`   ${vid.displayOrder}. ${vid.title} (${dur})`);
    }
  }

  console.log("\nDone! Created 4 courses with 14 videos total.");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
