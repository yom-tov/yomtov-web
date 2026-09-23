import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { videos } from "../lib/db/schema.ts";

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

const [row] = await db
  .select({ id: videos.id, title: videos.title })
  .from(videos)
  .where(eq(videos.muxPlaybackId, "B8Kf2uj758morcu6s5hOL7fhlg2kS4m0001NCwW1MOhNA"))
  .limit(1);

if (!row) {
  console.error("Video 1 not found!");
  process.exit(1);
}

console.log(`Old title: "${row.title}"`);

await db
  .update(videos)
  .set({ title: "חלק 1 - תרגילים ראשוניים" })
  .where(eq(videos.id, row.id));

console.log(`New title: "חלק 1 - תרגילים ראשוניים"`);
