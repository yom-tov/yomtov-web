import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { videos } from "../lib/db/schema.ts";

const url = process.env.POSTGRES_URL;
if (!url) {
  console.error("POSTGRES_URL is not set");
  process.exit(1);
}

const sql = neon(url);
const db = drizzle(sql);

const UPDATES = [
  {
    oldPlaybackId: "X01W3jxqkeQaNQNESOg1nuQWGaqczX6WAw9D9F01nPegs",
    newPlaybackId: "9EkSuCJ1rtNEIqOtKvr4JellId01osBnY54purF02asDM",
    num: 2,
  },
  {
    oldPlaybackId: "XoHlGBctupVmLOC8uiYZ300BvPeu9P8s3M483j53LqpE",
    newPlaybackId: "7xlP00yCI2itLaqcTz3A1501UOo002RD7BTMF3J4q7mBUM",
    num: 3,
  },
  {
    oldPlaybackId: "DenpluhWr5ZciCo4DQ1dGdzx01kfD9SZ01e1wFmNa02Fyg",
    newPlaybackId: "ym68bEDrjEEujQS7Pk4WaayBqSmfk1DDuezeh8saRBE",
    num: 4,
  },
  {
    oldPlaybackId: "vdBTYabpsi4xtQ023HkVtuVphE5Re2DcbnD1QbkQR02R00",
    newPlaybackId: "9FU8Uq1lhzYCc02N5Vwin7hqlvAlEtfpPxWHGfzZpYMc",
    durationSeconds: 14230,
    num: 5,
  },
  {
    oldPlaybackId: "kntC02lK7M11WDQZMcpI3q4JJgwwGpN02ArVW9TNZ474M",
    newPlaybackId: "Yuph3WpTfR3e9WICqjVS1MwAQyzI8WOkY00yq01tPgGqk",
    num: 6,
  },
  {
    oldPlaybackId: "01mXeX2qLnZn99TFTyMcy88ody9v1pkfTcAbpGLbuIDg",
    newPlaybackId: "VF8NOMOA2vLntPALtPEBaSW5C8hye02ckBroUIA99PZY",
    num: 7,
  },
  {
    oldPlaybackId: "MugSchV00OHcSy6iiBJSlO8bbHGQ01202M2acHHZVvbvMQ",
    newPlaybackId: "gjpxVxt02fdFVcc3j01U6f01dybN5Nb01BxZDjzGpbw02ZdE",
    num: 8,
  },
  {
    oldPlaybackId: "zuYGdYDdB314zmHjjWR00JwixcoxLu9N01EkzHaqbpZd4",
    newPlaybackId: "XXH7QPgubNcU7fHKwQV7EjrMcPAEKXpEjUNGNtbLbqA",
    num: 9,
  },
];

async function main() {
  let updated = 0;
  for (const u of UPDATES) {
    const [row] = await db
      .select({ id: videos.id, title: videos.title })
      .from(videos)
      .where(eq(videos.muxPlaybackId, u.oldPlaybackId))
      .limit(1);

    if (!row) {
      console.log(`[SKIP] Video #${u.num}: not found by old playback ID`);
      continue;
    }

    const setFields = { muxPlaybackId: u.newPlaybackId };
    if (u.durationSeconds) {
      setFields.durationSeconds = u.durationSeconds;
    }

    await db
      .update(videos)
      .set(setFields)
      .where(eq(videos.id, row.id));

    console.log(`[OK] Video #${u.num} "${row.title}": ${u.oldPlaybackId.slice(0, 12)}... → ${u.newPlaybackId.slice(0, 12)}...`);
    if (u.durationSeconds) {
      console.log(`  Also updated duration to ${u.durationSeconds}s`);
    }
    updated++;
  }

  console.log(`\nDone! Updated ${updated} videos.`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
